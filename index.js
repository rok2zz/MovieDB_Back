import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { getConnection, myapp } from "./DB.js"

import { registerHandler } from "./members.js"
import { loginHandler } from "./members.js"
import { meHandler } from "./members.js"
import { leaveHandler } from "./members.js"

import { boardHandler } from "./board.js"
import { contentsHandler } from "./board.js"
import { writeHandler } from "./board.js"
import { editHandler } from "./board.js"
import { deleteHandler } from "./board.js"

import { getReviewHandler, searchMovieHandler, writeReviewHandler } from "./movies.js"
import { getMovieHandler } from "./movies.js"


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
app.post('/leave', leaveHandler)
app.get('/me', meHandler) 

app.get('/search/:searchQuery', searchMovieHandler)
app.get('/movie/:id', getMovieHandler)
app.get('/review/:id', getReviewHandler)
app.post('/review/write', writeReviewHandler)

app.get('/delete/:id', deleteHandler)
//post로 변경
app.post('/write', writeHandler)
app.post('/edit', editHandler)
app.get('/board', boardHandler)
app.get('/contents/:id', contentsHandler)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

