const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function checkData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Checking Timetables for Section A ---');
        const [timetables] = await pool.query('SELECT * FROM timetables WHERE department = "CSE" AND year_level = "TE" AND division = "A"');
        console.log('Section A Timetables Count:', timetables.length);
        if (timetables.length > 0) {
            console.log('Sample Row:', timetables[0]);
        }

        console.log('\n--- Checking All Unique Divisions in Timetables ---');
        const [divisions] = await pool.query('SELECT DISTINCT division FROM timetables');
        console.log('Divisions in Timetables:', divisions.map(d => d.division));

        console.log('\n--- Checking Student Profile (Tejas) ---');
        const [student] = await pool.query('SELECT * FROM students WHERE user_id = (SELECT id FROM users WHERE name LIKE "%Tejas%" LIMIT 1)');
        if (student.length > 0) {
            console.log('Tejas Student Profile:', student[0]);
        } else {
            console.log('Tejas not found in students table');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkData();
