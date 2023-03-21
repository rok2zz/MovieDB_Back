import crypto from "crypto"

import { getConnection } from "../service/database.js"
import { encryptPassword } from "../util/utils.js"

const MEMBER_STATUS_NORMAL = 0
const MEMBER_STATUS_DELETED = 1

export async function v1LoginPOST(req, res) {
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

    let [rows] = await connection.query("SELECT * FROM `mv_members` WHERE `user_id`=? AND `user_pw`=? AND `status`=?", [req.body.id, cryptedPassword, MEMBER_STATUS_NORMAL])
    if (rows.length <= 0) {
        res.status(400).send("Invalid credentials")
        return
    }

    let account = rows[0]

    let token = crypto.createHash("sha256").update(account.user_id + account.user_pw + Math.random(999999).toString()).digest("hex")

    await connection.query("INSERT INTO `mv_tokens` (`token`, `user_id`) VALUES (?, ?)", [token, account.id])

    res.send({
        token: token
    })
}

export async function v1RegisterPOST(req, res) {
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

    let [rows] = await connection.query("SELECT * FROM `mv_members` WHERE `user_id`=? AND `status`=?", [fetchedID, MEMBER_STATUS_DELETED])
    if (rows.length > 0) {
        res.status(400).send("탈퇴한 아이디입니다.")
        return
    }

    [rows] = await connection.query("SELECT * FROM `mv_members` WHERE `user_id`=? AND `status`=?", [fetchedID, MEMBER_STATUS_NORMAL])
    if (rows.length > 0) {
        res.status(400).send("이미 가입했습니다")
        return
    }
    
    await connection.query("INSERT INTO `mv_members` (`user_id`, `user_pw`, `name`, `gender`, `email`) VALUES" +
    "(?, ?, ?, ?, ?)", [fetchedID, cryptedPassword, fetchedName, fetchedGender, fetchedEmail])

    res.send({
        success: true
    })
}