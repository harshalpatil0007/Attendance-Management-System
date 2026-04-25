const mysql = require('mysql2/promise');
require('dotenv').config();

async function getTeachers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await pool.query("SELECT id, name FROM users WHERE role = 'teacher'");
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

getTeachers();
