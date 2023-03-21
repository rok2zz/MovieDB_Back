import axios from "axios"

import { getConnection } from "../service/database.js"
import { getLoggedAccount, getResponseMovie, getResponseReview, insertMovie } from "../util/utils.js"

const MOVIES_LIMIT_NORMAL = 4
const REVIEWS_LIMIT_NORMAL = 5
const MORE_MOVIE_LIMIT = 8

export async function v1getMain(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    let [rows] = await connection.query("SELECT `movies`.*,count(*) FROM `mv_reviews` LEFT JOIN `movies` ON `mv_reviews`.`movie_id`=`movies`.`moviedb_id` GROUP BY `mv_reviews`.`movie_id`,`movies`.`id` ORDER BY `count(*)` DESC LIMIT 0,?", [MOVIES_LIMIT_NORMAL])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let moviesReviews = []

    // 리뷰 많은 순
    for (var i = 0; i < rows.length; i++) {
        moviesReviews.push(getResponseMovie(rows[i]))
    }

    let today = new Date(); 

    [rows] = await connection.query("SELECT * FROM `movies` WHERE `release_date`<? ORDER BY `release_date` DESC LIMIT 0,4", [today])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }
    
    let moviesNewest = []

    // 최근 나온 순
    for (var i = 0; i < rows.length; i++) {
        moviesNewest.push(getResponseMovie(rows[i]))
    }

    res.send({
        moviesReviews: moviesReviews,
        moviesNewest: moviesNewest
    })
}

export async function v1GetMoreMovies(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.type == null || req.params.type == "" || req.params.page == null || req.params.page == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedType = req.params.type
    let page = req.params.page

    // 리뷰 많은 순
    if (fetchedType == "reviews") {
        let [rows] = await connection.query("SELECT `movies`.*,count(*) FROM `mv_reviews` LEFT JOIN `movies` ON `mv_reviews`.`movie_id`=`movies`.`moviedb_id` GROUP BY `mv_reviews`.`movie_id`,`movies`.`id` ORDER BY `count(*)` DESC LIMIT ?,?", [page * MORE_MOVIE_LIMIT, MORE_MOVIE_LIMIT])
        if (rows.length <= 0) {
            res.status(400).send("Bad request")
            return
        }

        let [count] = await connection.query("SELECT count(*) FROM `mv_reviews` GROUP BY `movie_id`")
        count = count.length
        if (count <= 0) {
            res.status(400).send("Bad request")
            return
        }

        let moviesReviews = []

        for (var i = 0; i < rows.length; i++) {
            moviesReviews.push(getResponseMovie(rows[i]))
        }

        res.send({
            moviesReviews: moviesReviews,
            count: count
        })

        return
    }

    // 츼근 나온 순
    let today = new Date(); 

    let [count] = await connection.query("SELECT count(*) AS `newest` FROM `movies`")
    count = count[0].newest
    if (count <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let [rows] = await connection.query("SELECT * FROM `movies` WHERE `release_date`<? ORDER BY `release_date` DESC LIMIT ?,?", [today, page * MORE_MOVIE_LIMIT, MORE_MOVIE_LIMIT])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }
    
    let moviesNewest = []

    for (var i = 0; i < rows.length; i++) {
        moviesNewest.push(getResponseMovie(rows[i]))
    }

    res.send({
        moviesNewest: moviesNewest,
        count: count
    })
}

export async function v1SearchMovieGet(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.searchQuery == null || req.params.searchQuery == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedSearchQuery = req.params.searchQuery

    let searchTitle = "%" + fetchedSearchQuery + "%"

    let movies = []

    // DB에 검색결과 존재
    let [rows] = await connection.query("SELECT * FROM `movies` WHERE `title` LIKE ?", [searchTitle])
    if (rows.length > 0) {
        for (var i = 0; i < rows.length; i++) {
            movies.push(getResponseMovie(rows[i]))
        }

        res.send({
            movies: movies
        })

        return
    }

    let movieID = []
    movieID = await getMovieID(fetchedSearchQuery)

    await insertMovie(movieID, connection);

    [rows] = await connection.query("SELECT * FROM `movies` WHERE `title` LIKE ?", [searchTitle])
    if (rows.length <= 0) {
        res.send({
            search: "none",
            movies: movies
        })

        return
    }

    for (var i = 0; i < rows.length; i++) {
        movies.push(getResponseMovie(rows[i]))
    }

    res.send({
        movies: movies
    })
}

export async function v1ReSearchMovieGet(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.searchQuery == null || req.params.searchQuery == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedSearchQuery = req.params.searchQuery

    let searchTitle = "%" + fetchedSearchQuery + "%"

    let movies = []
    let movieID = []

    movieID = await getMovieID(fetchedSearchQuery)

    await insertMovie(movieID, connection)

    let [rows] = await connection.query("SELECT * FROM `movies` WHERE `title` LIKE ?", [searchTitle])
    if (rows.length <= 0) {
        res.send({
            search: "none",
            movies: movies
        })

        return
    }

    for (var i = 0; i < rows.length; i++) {
        movies.push(getResponseMovie(rows[i]))
    }

    res.send({
        movies: movies
    })
}

export async function v1GetRandomMovieID(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    let [rows] = await connection.query("SELECT `moviedb_id` FROM `movies` ORDER BY RAND() LIMIT 1")
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let movie = rows[0]
    
    res.send({
        movieID: movie.moviedb_id
    })
}

export async function v1GetMovie(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.params.id == null || req.params.id == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.params.id

    let [row] = await connection.query("SELECT * FROM `movies` WHERE `moviedb_id`=?", [fetchedID])
    if (row.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let movie = getResponseMovie(row[0])
    
    res.send({
        movie: movie
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

    if (req.body.rating == null || req.body.rating == "" || req.body.review == null || req.body.review == ""
        || req.body.movie_id == null || req.body.movie_id == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedRating = req.body.rating
    let fetchedReview = req.body.review
    let fetchedMovieID = req.body.movie_id

    let [rows] = await connection.query("SELECT * FROM `mv_reviews` WHERE `reviewer_id`=? AND `movie_id`=?", [account.id, fetchedMovieID])
    if (rows.length > 0) {
        res.status(400).send("이미 작성했습니다.")
        return
    }
  
    await connection.query("INSERT INTO `mv_reviews` (`movie_id`, `reviewer_id`, `rating`, `review`) VALUES" + 
    "(?, ?, ?, ?)", [fetchedMovieID, account.id, fetchedRating, fetchedReview])
    
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

    if (req.params.id == null || req.params.id == "" || req.params.page == null || req.params.page == "") {
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

    let [count] = await connection.query("SELECT COUNT(*) AS `reviews` FROM `mv_reviews` WHERE `movie_id`=?", [fetchedID])
    
    count = count[0]

    if (count.reviews <= 0) {
        res.send({
            response: "reviews are not exist",
            count: 0
        })

        return
    }

    if (req.headers["authorization"] != null) {
        let account = await getLoggedAccount(req, res)
        if (account == null) {
            res.status(400).send("Not logged in")
            return
        }

        let [row] = await connection.query("SELECT`mv_reviews`.*,`mv_members`.`user_id` FROM `mv_reviews` LEFT JOIN `mv_members` ON `mv_reviews`.`reviewer_id`=`mv_members`.`id` WHERE `movie_id`=? AND `reviewer_id`=? LIMIT ?,?", [fetchedID, account.id, fetchedPage * REVIEWS_LIMIT_NORMAL, REVIEWS_LIMIT_NORMAL])
        // 로그인o 내 리뷰o
        if (row.length > 0) {
            let myReview = getResponseReview(row[0])

            let [rows] = await connection.query("SELECT `mv_reviews`.*,`mv_members`.`user_id` FROM `mv_reviews` LEFT JOIN `mv_members` ON `mv_reviews`.`reviewer_id`=`mv_members`.`id` WHERE `movie_id`=? AND NOT `reviewer_id`=? LIMIT ?,?", [fetchedID, myReview.reviewerID, fetchedPage * REVIEWS_LIMIT_NORMAL, REVIEWS_LIMIT_NORMAL])
            if (rows.length <= 0) {
                res.send({
                    reviews: reviews,
                    count: count.reviews,
                    myReview: myReview
                })
        
                return
            } 
            
            for (var i = 0; i < rows.length; i++) {
                reviews.push(getResponseReview(rows[i]))
            }

            res.send({
                reviews: reviews,
                count: count.reviews,
                myReview: myReview

            })

            return
        } 

        // 로그인o 내 리뷰x
        let [rows] = await connection.query("SELECT `mv_reviews`.*,`mv_members`.`user_id` FROM `mv_reviews` LEFT JOIN `mv_members` ON `mv_reviews`.`reviewer_id`=`mv_members`.`id` WHERE `movie_id`=? LIMIT ?,?", [fetchedID, fetchedPage * REVIEWS_LIMIT_NORMAL, REVIEWS_LIMIT_NORMAL])
        if (rows.length <= 0) {
            res.send({
                response: "reviews are not exist"
            })
    
            return
        } 

        for (var i = 0; i < rows.length; i++) {
            reviews.push(getResponseReview(rows[i]))
        }

        res.send({
            reviews: reviews,
            count: count.reviews
        })

        return
    }

    // 로그인x
    let [rows] = await connection.query("SELECT `mv_reviews`.*,`mv_members`.`user_id` FROM `mv_reviews` LEFT JOIN `mv_members` ON `mv_reviews`.`reviewer_id`=`mv_members`.`id` WHERE `movie_id`=? LIMIT ?,?", [fetchedID, fetchedPage * REVIEWS_LIMIT_NORMAL, REVIEWS_LIMIT_NORMAL])
    if (rows.length <= 0) {
        res.send({
            response: "reviews not exist"
        })

        return
    }    

    for (var i = 0; i < rows.length; i++) {
        reviews.push(getResponseReview(rows[i]))
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

    if (req.body.myReviewID == null || req.body.myReviewID == "") {
        res.status(400).send("Bad request")
        return
    }

    let fetchedMyReviewID = req.body.myReviewID

    await connection.query("DELETE FROM `mv_reviews` WHERE `id`=?", [fetchedMyReviewID])

    res.send({
        success: true
    })
}

export async function getMovieID(searchQuery) {
    let movieID = []

    await axios.get("https://www.themoviedb.org/search?query=" + searchQuery + "&language=ko-KR" , {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.76"
        }
    }).catch(() => {
        res.send(500)
    }).then((response) => {
        let responseData = response.data
        let splitData = responseData.split('" class="result" href="/movie/')

        let data = []

        for(var i = 1; i < splitData.length / 2; i++) {
            data = splitData[i * 2]

            data = data.split('?language=ko-KR"><h2>')[0]

            movieID[i - 1] = data.toString()
        }
    })

    return movieID
}

