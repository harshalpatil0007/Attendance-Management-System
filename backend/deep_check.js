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
        console.log('--- Tejas Profile Details ---');
        const [tejas] = await pool.query(`
            SELECT u.name, s.* 
            FROM users u 
            JOIN students s ON u.id = s.user_id 
            WHERE u.name LIKE "%Tejas%"
        `);
        console.log(tejas[0]);

        console.log('\n--- Timetable Entries for that Section ---');
        if (tejas.length > 0) {
            const [rows] = await pool.query(`
                SELECT * FROM timetables 
                WHERE department = ? AND year_level = ? AND division = ?
            `, [tejas[0].department, tejas[0].current_year, tejas[0].division]);
            console.log('Rows Count:', rows.length);
            if (rows.length > 0) console.log('Sample Row:', rows[0]);
        }
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}

check();
