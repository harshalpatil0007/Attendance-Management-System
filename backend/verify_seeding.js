const mysql = require('mysql2/promise');
require('dotenv').config();

async function verify() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await pool.query(`
            SELECT t.day_of_week, t.start_time, s.subject_name, u.name as teacher 
            FROM timetables t 
            JOIN subjects s ON t.subject_id = s.id 
            LEFT JOIN users u ON t.teacher_id = u.id
            WHERE t.department = 'Computer Engineering' AND t.year_level = 'TE' AND t.division = 'A' 
            ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time
        `);
        console.table(rows);
        console.log('Total rows:', rows.length);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

verify();
