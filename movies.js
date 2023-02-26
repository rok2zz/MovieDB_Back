import axios from "axios"

import { getConnection } from "./DB.js"
import { getMovieID } from "./utils.js"
import { getLoggedAccount } from "./utils.js"

export async function searchMovieHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.searchQuery == null || req.params.searchQuery == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedSearchQuery = req.params.searchQuery

    let searchTitle = "%" + fetchedSearchQuery + "%"

    let [rows] = await connection.query("SELECT * FROM `movies` WHERE `title` LIKE ?", [searchTitle])
    if (rows.length > 0) {
        let movies = []

        for (var i = 0; i < rows.length; i++) {
            movies.push({
                id: rows[i].id,
                title: rows[i].title,
                overview: rows[i].overview,
                posterPath: rows[i].poster_path,
                tagline: rows[i].tagline,
                releaseDate: rows[i].release_date,
                genres: rows[i].genres,
                country: rows[i].country,
                runtime: rows[i].runtime
            })
        }

        res.send({
            movies: movies
        })

        return
    }

    let movieID = []
    movieID = await getMovieID(fetchedSearchQuery)

    for (var i = 0; i < movieID.length; i++) {
        await axios.get("https://api.themoviedb.org/3/movie/" + movieID[i] + "?api_key=423e4d97afab4ad57572edc030b2f998&language=ko-KR", {
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.76"
            }
        }).catch(function() {
            alert("error")
        }).then(async (response) => {
            let genres = response.data.genres
            let countries = response.data.production_countries

            let fetchedID = response.data.id
            let fetchedTitle = response.data.title
            let fetchedOverview = response.data.overview
            let fetchedPosterPath = response.data.poster_path
            let fetchedTagline = response.data.tagline
            let fetchedReleaseDate = response.data.release_date
            let fetchedGenres = genres[0]?.name
            let fetchedCountries = countries[0]?.name
            let fetchedRuntime = response.data.runtime

            if (genres.length > 1) {
                for (var i = 1; i < genres.length; i++) {
                    fetchedGenres = fetchedGenres + ", " + genres[i].name
                }
            }
            
            if (countries.length > 1) {
                for (var i = 1; i < countries.length; i++) {
                    fetchedCountries = fetchedCountries + ", " + countries[i].name
                }
            }

            await connection.query("INSERT INTO `movies` (`id`, `title`, `overview`, `poster_path`, `tagline`, `release_date`, `genres`, `country`, `runtime`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            , [fetchedID, fetchedTitle, fetchedOverview, fetchedPosterPath, fetchedTagline, fetchedReleaseDate, fetchedGenres, fetchedCountries, fetchedRuntime])
        })
    }

    [rows] = await connection.query("SELECT * FROM `movies` WHERE `title` LIKE ?", [searchTitle])
    if (rows.length <= 0) {
        res.send({
            search: "none"
        })

        return
    }

    let movies = []

    for (var i = 0; i < rows.length; i++) {
        movies.push({
            id: rows[i].id,
            title: rows[i].title,
            overview: rows[i].overview,
            posterPath: rows[i].poster_path,
            tagline: rows[i].tagline,
            releaseDate: rows[i].release_date,
            genres: rows[i].genres,
            country: rows[i].country,
            runtime: rows[i].runtime
        })
    }

    res.send({
        movies: movies
    })
}

export async function getMovieHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.id == null || req.params.id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.params.id

    let [rows] = await connection.query("SELECT * FROM `movies` WHERE `id`=?", [fetchedID])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let movie = rows[0]
    
    res.send({
        movie: {
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path,
            tagline: movie.tagline,
            releaseDate: movie.release_date,
            genres: movie.genres,
            country: movie.country,
            runtime: movie.runtime
        }
    })
}

export async function writeReviewHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    let account = await getLoggedAccount(req, res)
    if (account == null) {
        res.status(400).send("Not logged in")
        return
    }

    if (req.body.rating == null || req.body.rating == undefined 
        || req.body.review == null || req.body.review == undefined
        || req.body.movie_id == null || req.body.movie_id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedRating = req.body.rating
    let fetchedReview = req.body.review
    let fetchedMovieID = req.body.movie_id

    let [rows] = await connection.query("SELECT * FROM `movie_reviews` WHERE `reviewer_id`=? AND `movie_id`=?", [account.id, fetchedMovieID])
    if (rows.length > 0) {
        res.status(400).send("이미 작성했습니다.")
        return
    }
  
    await connection.query("INSERT INTO `movie_reviews` (`movie_id`, `reviewer_id`, `rating`, `review`) values (?, ?, ?, ?)",
    [fetchedMovieID, account.id, fetchedRating, fetchedReview])
    
    res.send({
        success: true
    })
}

export async function getReviewHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.id == null || req.params.id == undefined 
        || req.params.page == null || req.params.page == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.params.id

    let fetchedPage = Number(req.params.page)
    if (isNaN(fetchedPage) || fetchedPage < 0) {
        res.status(400).send("Bad request")
        return
    }

    let reviews = []

    let [count] = await connection.query("SELECT COUNT(*) AS `reviews` FROM `movie_reviews` WHERE `movie_id`=?", [fetchedID])
    count = count[0]

    if (req.headers["authorization"] != null) {
        let account = await getLoggedAccount(req, res)
        if (account == null) {
            res.status(400).send("Not logged in")
            return
        }

        let [myReview] = await connection.query("SELECT`movie_reviews`.*,`movie_members`.`user_id` FROM `movie_reviews` LEFT JOIN `movie_members` ON `movie_reviews`.`reviewer_id`=`movie_members`.`id` WHERE `movie_id`=? AND `reviewer_id`=? LIMIT ?,?", [fetchedID, account.id, fetchedPage * 5, 5])
        // 로그인o 내 리뷰o
        if (myReview.length > 0) {
            myReview = myReview[0]

            let [rows] = await connection.query("SELECT `movie_reviews`.*,`movie_members`.`user_id` FROM `movie_reviews` LEFT JOIN `movie_members` ON `movie_reviews`.`reviewer_id`=`movie_members`.`id` WHERE `movie_id`=? AND NOT `reviewer_id`=? LIMIT ?,?", [fetchedID, myReview.reviewer_id, fetchedPage * 5, 5])
            if (rows.length <= 0) {
                res.send({
                    reviews: reviews,
                    count: count.reviews,
                    myReview: {
                        id: myReview.id,
                        movieID: myReview.movie_id,
                        reviewerID: myReview.reviewer_id,
                        reviewer: myReview.user_id,
                        rating: myReview.rating,
                        review: myReview.review,
                        writedDate: myReview.writed_date,
                    }
                })
        
                return
            } 
            
            for (var i = 0; i < rows.length; i++) {
                reviews.push({
                    id: rows[i].id,
                    movieID: rows[i].movie_id,
                    reviewerID: rows[i].reviewer_id,
                    reviewer: rows[i].user_id,
                    rating: rows[i].rating,
                    review: rows[i].review,
                    writedDate: rows[i].writed_date,
                })
            }

            res.send({
                reviews: reviews,
                count: count.reviews,
                myReview: {
                    id: myReview.id,
                    movieID: myReview.movie_id,
                    reviewerID: myReview.reviewer_id,
                    reviewer: myReview.user_id,
                    rating: myReview.rating,
                    review: myReview.review,
                    writedDate: myReview.writed_date,
                }
            })

            return
        } 

        // 로그인o 내 리뷰x
        let [rows] = await connection.query("SELECT `movie_reviews`.*,`movie_members`.`user_id` FROM `movie_reviews` LEFT JOIN `movie_members` ON `movie_reviews`.`reviewer_id`=`movie_members`.`id` WHERE `movie_id`=? LIMIT ?,?", [fetchedID, fetchedPage * 5, 5])
        if (rows.length <= 0) {
            res.send({
                response: "reviews not exist"
            })
    
            return
        } 

        for (var i = 0; i < rows.length; i++) {
            reviews.push({
                id: rows[i].id,
                movieID: rows[i].movie_id,
                reviewerID: rows[i].reviewer_id,
                reviewer: rows[i].user_id,
                rating: rows[i].rating,
                review: rows[i].review,
                writedDate: rows[i].writed_date,
            })
        }

        res.send({
            reviews: reviews,
            count: count.reviews
        })

        return
    }

    // 로그인x
    let [rows] = await connection.query("SELECT `movie_reviews`.*,`movie_members`.`user_id` FROM `movie_reviews` LEFT JOIN `movie_members` ON `movie_reviews`.`reviewer_id`=`movie_members`.`id` WHERE `movie_id`=? LIMIT ?,?", [fetchedID, fetchedPage * 5, 5])
    if (rows.length <= 0) {
        res.send({
            response: "reviews not exist"
        })

        return
    }    

    for (var i = 0; i < rows.length; i++) {
        reviews.push({
            id: rows[i].id,
            movieID: rows[i].movie_id,
            reviewerID: rows[i].reviewer_id,
            reviewer: rows[i].user_id,
            rating: rows[i].rating,
            review: rows[i].review,
            writedDate: rows[i].writed_date,
        })
    }

    res.send({
        reviews: reviews,
        count: count.reviews
    })
}

export async function deleteReviewHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    let account = await getLoggedAccount(req, res)
    if (account == null) {
        res.status(400).send("Not logged in")
        return
    }

    if (req.body.myReviewID == null || req.body.myReviewID == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedMyReviewID = req.body.myReviewID

    await connection.query("DELETE FROM `movie_reviews` WHERE `id`=?", [fetchedMyReviewID])

    res.send({
        success: true
    })
}