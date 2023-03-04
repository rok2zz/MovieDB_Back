import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { getConnection, myapp } from "./DB.js"

import { registerHandler, loginHandler } from "./members.js"

import { getMovieHandler, deleteReviewHandler, getMainHandler, getMoreMoviesHandler
    , getRandomMovieHandler, getReviewHandler, reSearchMovieHandler, searchMovieHandler, writeReviewHandler } from "./movies.js"

const app = express()
const port = 3000

dotenv.config()

var connection;
app.use(express.json())
app.use(cors())

myapp();

connection = getConnection

app.post('/login', loginHandler)
app.post('/register', registerHandler)

app.get('/main', getMainHandler)
app.get('/mainitems/:type/:page', getMoreMoviesHandler)

app.get('/search/:searchQuery', searchMovieHandler)
app.get('/search/re/:searchQuery', reSearchMovieHandler)

app.get('/movie/:id', getMovieHandler)
app.get('/random', getRandomMovieHandler)

app.get('/review/:id/:page', getReviewHandler)
app.post('/review/write', writeReviewHandler)
app.post('/review/delete', deleteReviewHandler)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

