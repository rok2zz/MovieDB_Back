import axios from "axios"
import crypto from "crypto"

import { getConnection } from "./DB.js"

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

    let [rows] = await connection.query("SELECT * FROM `movie_tokens` WHERE `token`=?", [authToken])
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

export async function getMovieID(searchQuery) {
    let movieID = []

    await axios.get("https://www.themoviedb.org/search?query=" + searchQuery + "&language=ko-KR" , {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.76"
        }
    }).catch(() => {
        alert("error")
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