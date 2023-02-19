import crypto from "crypto"

import { getConnection } from "./DB.js"
import { getLoggedAccount } from "./utils.js"
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

    let token = crypto.createHash("sha256").update(rows[0].user_id + rows[0].user_pw + Math.random(999999).toString()).digest("hex")

    await connection.query("INSERT INTO `movie_token` (`id`, `token`) VALUES (?, ?)", [rows[0].id, token])

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

export async function meHandler(req, res) {
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

    let [count] = await connection.query("SELECT COUNT(*) AS `writecount` FROM `board` WHERE `user_id`=?", [account.id])
    let writecount = count[0].writecount

    res.send({
        id: account.id,
        user_id: account.user_id,
        email: account.email,
        gender: account.gender,
        name: account.name,
        registeredDate: account.registered_date,

        count: writecount
    })
}

export async function leaveHandler(req, res) {
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

    await connection.query("UPDATE `movie_members` SET `status`=1 WHERE `id`=?", [account.id])
    await connection.query("DELETE FROM `movie_token` WHERE `id`=?", [account.id])

    res.send({
        success: true
    })
}