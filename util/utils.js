import crypto from "crypto"
import axios from "axios"

import { getConnection } from "../service/database.js"

const API_KEY = "?api_key=423e4d97afab4ad57572edc030b2f998&language=ko-KR"

export async function getLoggedAccount(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    let authToken = req.headers["authorization"]
    
    if (authToken == "" || authToken == undefined || authToken == null) {
        res.status(401).send("Unauthorized")
        return
    }

    let [rows] = await connection.query("SELECT * FROM `mv_tokens` WHERE `token`=?", [authToken])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let loggedAccount = rows[0]

    return loggedAccount
}

export function encryptPassword(input) {
    return crypto.createHash('sha256').update(input + "mysecretpw").digest('hex')
}

export function getResponseMovie(row) {
    return {
        id: row.moviedb_id,
        title: row.title,
        overview: row.overview,
        posterPath: row.poster_path,
        tagline: row.tagline,
        releaseDate: row.release_date,
        genres: row.genres,
        country: row.country,
        runtime: row.runtime
    }
}

export function getResponseReview(row) {
    return {
        id: row.id,
        movieID: row.movie_id,
        reviewerID: row.reviewer_id,
        reviewer: row.user_id,
        rating: row.rating,
        review: row.review,
        writedDate: row.writed_date
    }
}

export async function insertMovie(movieID, connection) {
    let lists = ""

    movieID.forEach(item => {
        let operator = ""

        if (lists != "") {
            operator = " OR"
        }

        lists += operator + " `moviedb_id`=" + item
    })

    let [results] = await connection.query("SELECT * FROM `movies` WHERE '" + lists +"'")

    let parseNeeded = [];
    for (let i = 0; i < movieID.length; i++) {
        let found = false;
        for (let j = 0; j < results.length; j++) {
            if (movieID[i] == results[j].moviedb_id) {
                found = true
                break
            }
        }

        if (!found) {
            parseNeeded.push(movieID[i])
        }
    }

    // DB에 검색결과 존재x => api 호출 후 DB에 저장
    for (var i = 0; i < parseNeeded.length; i++) {
        await axios.get("https://api.themoviedb.org/3/movie/" + parseNeeded[i] + API_KEY, {
        }).catch(function() {
            res.status(500).send(" internal server error response")
            return
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

            if (genres.length > 1 && fetchedGenres != null) {
                for (var i = 1; i < genres.length; i++) {
                    fetchedGenres = fetchedGenres + ", " + genres[i].name
                }
            }
            
            if (countries.length > 1 && fetchedCountries != null) {
                for (var i = 1; i < countries.length; i++) {
                    fetchedCountries = fetchedCountries + ", " + countries[i].name
                }
            }

            await connection.query("INSERT INTO `movies` (`moviedb_id`, `title`, `overview`, `poster_path`, `tagline`, `release_date`, `genres`, `country`, `runtime`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            , [fetchedID, fetchedTitle, fetchedOverview, fetchedPosterPath, fetchedTagline, fetchedReleaseDate, fetchedGenres, fetchedCountries, fetchedRuntime])
        })
    }
}