const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Fixing Student Data ---');
        await pool.query("UPDATE students SET current_year = year_semester WHERE current_year IS NULL OR current_year = ''");
        await pool.query("UPDATE students SET department = 'Computer Engineering' WHERE department IN ('Computer Science', 'CSE')");
        
        console.log('--- Fixing Timetable Data ---');
        await pool.query("UPDATE timetables SET department = 'Computer Engineering' WHERE department IN ('Computer Science', 'CSE')");
        
        const [tejas] = await pool.query("SELECT s.* FROM students s JOIN users u ON s.user_id = u.id WHERE u.name LIKE '%Tejas%'");
        console.log('Tejas after fix:', tejas[0]);

        const [rows] = await pool.query(
            "SELECT COUNT(*) as count FROM timetables WHERE department = ? AND year_level = ? AND division = ?",
            [tejas[0].department, tejas[0].current_year, tejas[0].division]
        );
        console.log('Matching timetable rows:', rows[0].count);

    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}

fix();
