import mysql from "mysql2/promise"

var connection

export async function myapp() {
    connection = await mysql.createConnection({
        host     : process.env.DB_SERVER_ADDR,
        user     : process.env.DB_SERVER_USER,
        password : process.env.DB_SERVER_PASSWORD,
        database : process.env.DB_SERVER_DATABASE,
    })
      
    await connection.connect()
}

export function getConnection() {
    return connection
}