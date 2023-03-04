import crypto from "crypto"

import { getConnection } from "./DB.js"
import { encryptPassword } from "./utils.js"

export async function loginHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.body.id == null || req.body.id == "" || req.body.pw == null || req.body.pw == "") {
        res.status(400).send("Bad request")
        return
    }

    let cryptedPassword = encryptPassword(req.body.pw)

    let [rows] = await connection.query("SELECT * FROM `movie_members` WHERE `user_id`=? AND `user_pw`=? AND `status`=?", [req.body.id, cryptedPassword, 0])
    if (rows.length <= 0) {
        res.status(400).send("Invalid credentials")
        return
    }

    let account = rows[0]

    let token = crypto.createHash("sha256").update(account.user_id + account.user_pw + Math.random(999999).toString()).digest("hex")

    await connection.query("INSERT INTO `movie_tokens` (`id`, `token`) VALUES (?, ?)", [account.id, token])

    res.send({
        token: token
    })
}

export async function registerHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.body.id == null || req.body.id == undefined || req.body.pw == null || req.body.pw == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.body.id
    let fetchedPassword = req.body.pw
    let fetchedName = req.body.name
    let fetchedGender = req.body.gender
    let fetchedEmail = req.body.email

    let cryptedPassword = encryptPassword(fetchedPassword)

    let [rows] = await connection.query("SELECT * FROM `movie_members` WHERE `user_id`=? AND `status`=1", [fetchedID])
    if (rows.length > 0) {
        res.status(400).send("탈퇴한 아이디입니다.")
        return
    }

    [rows] = await connection.query("SELECT * FROM `movie_members` WHERE `user_id`=? AND `status`=0", [fetchedID])
    if (rows.length > 0) {
        res.status(400).send("이미 가입했습니다")
        return
    }
    
    await connection.query("INSERT INTO `movie_members` (`user_id`, `user_pw`, `name`, `gender`, `email`) VALUES (?, ?, ?, ?, ?)"
        , [fetchedID, cryptedPassword, fetchedName, fetchedGender, fetchedEmail])

    res.send({
        success: true
    })
}