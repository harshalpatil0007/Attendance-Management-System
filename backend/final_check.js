const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [students] = await pool.query('SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id');
        console.log('Students:', students.map(s => ({ name: s.name, dept: s.department })));

        const [timetable] = await pool.query('SELECT DISTINCT department FROM timetables');
        console.log('Timetable Depts:', timetable.map(t => t.department));
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}

check();
