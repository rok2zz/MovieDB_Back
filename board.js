import { getConnection } from "./DB.js"
import { getLoggedAccount } from "./utils.js"

export async function boardHandler(req, res) {
    let connection = getConnection()
    if (connection == null) {
        res.status(500).send("DB not inited yet")
        return
    }

    if (req.query.subject == null || req.query.subject == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedSubject = req.query.subject
    let page = req.query.page

    let [count] = await connection.query("SELECT COUNT(*) AS `writecount` FROM `board` WHERE `subject`=?", [fetchedSubject])
    let writecount = count[0].writecount
    if (writecount <= 0 ) {
        res.status(400).send("Bad request")
        return
    }

    let numberPage = Number(page) - 1
    if (isNaN(numberPage) || numberPage < 0) {
        res.status(400).send("Bad request")
        return
    }

    let [rows] = await connection.query("SELECT `board`.*,`members`.`name` FROM `board` LEFT JOIN `members` ON `board`.`user_id`=`members`.`id`" +
    "WHERE `subject`=? ORDER BY `id` DESC LIMIT ?,?", [fetchedSubject, numberPage * 5, 5])
 
    res.send({
        board: rows,
        count: writecount
    })
}  

export async function contentsHandler(req, res) {
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
    
    let [rows] = await connection.query("SELECT `board`.*,`members`.`name`,`members`.`user_id` AS `writer_id`" +
    "FROM `board` LEFT JOIN `members` ON `board`.`user_id`=`members`.`id` WHERE `board`.`id`=?", [fetchedID])
    if (rows.length <= 0) {
        res.status(400).send("Bad request")
        return
    }

    let editable = false

    if (req.headers["authorization"] != null) {
        let account = await getLoggedAccount(req, res)
        if (account == null) {
            res.status(400).send("Not logged in")
            return
        }

        if (rows[0].user_id == account.id) {
            editable = true
        }
    }

    res.send({
        contents: rows[0],
        editable: editable
    })
}

export async function writeHandler(req, res) {
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

    if (req.body.title == null || req.body.title == undefined || req.body.contents == null || req.body.contents == undefined
     || req.body.subject == null || req.body.subject == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedTitle = req.body.title
    let fetchedContents = req.body.contents
    let fetchedSubject = req.body.subject
    
    await connection.query("INSERT INTO `board` (`title`, `contents`, `subject`, `user_id`) VALUES (?, ?, ?, ?)",
     [fetchedTitle, fetchedContents, fetchedSubject, account.id])

    res.send({
        success: true
    })
}

export async function editHandler(req, res) {
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

    if (req.body.title == null || req.body.title == undefined || req.body.contents == null || req.body.contents == undefined
    || req.body.id == null || req.body.id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedTitle = req.body.title
    let fetchedContents = req.body.contents
    let fetchedID = req.body.id
    
    await connection.query("UPDATE `board` SET `title`=?,`contents`=? WHERE `id`=?",
     [fetchedTitle, fetchedContents, fetchedID])

    res.send({
        success: true
    })
}

export async function deleteHandler(req, res) {
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

    if (req.params.id== null || req.params.id == undefined) {
        res.status(400).send("Bad request")
        return
    }

    let fetchedID = req.params.id
    
    await connection.query("DELETE FROM `board` WHERE `id`=? AND `user_id`=?", [fetchedID, account.id])

    res.send({
        success: true
    })
}