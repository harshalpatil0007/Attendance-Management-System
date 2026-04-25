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
        console.log('--- ALL STUDENTS ---');
        const [students] = await pool.query('SELECT user_id, department, current_year, division FROM students');
        console.log(students);

        console.log('\n--- TIMETABLE DEPTS ---');
        const [depts] = await pool.query('SELECT DISTINCT department FROM timetables');
        console.log(depts);

        console.log('\n--- TIMETABLE SAMPLE FOR TE A ---');
        const [rows] = await pool.query('SELECT * FROM timetables WHERE year_level = "TE" AND division = "A" LIMIT 1');
        console.log(rows);
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}

check();
