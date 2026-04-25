const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Checking Timetables ---');
        const [timetables] = await pool.query('SELECT * FROM timetables LIMIT 5');
        console.log('Timetable Sample:', timetables);

        console.log('\n--- Unique Sections in Timetables ---');
        const [sections] = await pool.query('SELECT DISTINCT department, year_level, division FROM timetables');
        console.log('Available Sections:', sections);

        console.log('\n--- Sample Student Profile ---');
        const [students] = await pool.query('SELECT department, current_year, division FROM students LIMIT 5');
        console.log('Student Profiles:', students);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkData();
