const mysql = require('mysql2/promise');
require('dotenv').config();

async function searchTeachers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const names = ['Pawar', 'Waghmare', 'Medhe', 'Kakde', 'Patil'];
        const query = `SELECT id, name, role FROM users WHERE ${names.map(n => `name LIKE '%${n}%'`).join(' OR ')}`;
        const [rows] = await pool.query(query);
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

searchTeachers();
