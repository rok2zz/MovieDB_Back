import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { myapp } from "./service/database.js"

import { v1RegisterPOST, v1LoginPOST } from "./api/members.js"

import { v1GetMovie, deleteReviewHandler, v1getMain, v1GetMoreMovies
    , v1GetRandomMovieID, getReviewHandler, v1ReSearchMovieGet, v1SearchMovieGet, writeReviewHandler } from "./api/movies.js"

const app = express()
const port = 3000

dotenv.config()

app.use(express.json())
app.use(cors())

myapp();

app.post('/login', v1LoginPOST)
app.post('/register', v1RegisterPOST)

app.get('/main', v1getMain)
app.get('/mainitems/:type/:page', v1GetMoreMovies)

app.get('/search/:searchQuery', v1SearchMovieGet)
app.get('/search/re/:searchQuery', v1ReSearchMovieGet)

app.get('/movie/:id', v1GetMovie)
app.get('/random', v1GetRandomMovieID)

app.get('/review/:id/:page', getReviewHandler)
app.post('/review/write', writeReviewHandler)
app.post('/review/delete', deleteReviewHandler)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

