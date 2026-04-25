const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSubjects() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Normalizing Subjects Departments ---');
        const [res] = await pool.query(
            "UPDATE subjects SET department = 'Computer Engineering' WHERE department IN ('Computer Science', 'CSE')"
        );
        console.log(`Updated ${res.affectedRows} subjects.`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

updateSubjects();
