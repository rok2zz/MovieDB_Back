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
        res.send({
            movies: rows
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

    res.send({
        movies: rows
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

    if (req.body.rating == null || req.body.rating == undefined 
        || req.body.review == null || req.body.review == undefined
        || req.body.movie_id == null || req.body.movie_id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedRating = req.body.rating
    let fetchedReview = req.body.review
    let fetchedMovieID = req.body.movie_id

    let [rows] = await connection.query("SELECT * FROM `movie_reviews` WHERE `id`=?", [account.id])
    if (rows.length > 0) {
        res.status(400).send("Bad request")
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

    if (req.params.id == null || req.params.id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.params.id

    let [rows] = await connection.query("SELECT * FROM `movie_reviews` WHERE `movie_id`=?", [fetchedID])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let [count] = await connection.query("SELECT COUNT(*) AS `reviews` FROM `movie_reviews` WHERE `movie_id`=?", [fetchedID])

    let reviews = rows[0]
    let myReviewID = 0

    if (req.headers["authorization"] != null) {
        let account = await getLoggedAccount(req, res)
        if (account == null) {
            res.status(400).send("Not logged in")
            return
        }

        for (var i = 0; i < reviews.length; i++) {   
            if (reviews[i].reviewer_id == account.id) {
                myReviewID = reviews[i].id
            }
        }
    }
    
    res.send({
        reviews: reviews,
        count: count,
        myReviewID: myReviewID
    })
}