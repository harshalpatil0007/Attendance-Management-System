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
        console.log('--- Fixing Computer Networks Subject ---');
        
        // 1. Update Computer Networks theory subject
        const [result] = await pool.query(`
            UPDATE subjects 
            SET subject_code = 'CSE602', semester = 6 
            WHERE subject_name = 'Computer Networks' AND (subject_code = 'CSE303' OR semester = 3 OR semester = 5)
        `);
        
        console.log(`Updated ${result.affectedRows} row(s).`);
        
        if (result.affectedRows === 0) {
            console.log('No subject found matching criteria, or already updated.');
        }

        // 2. Verify
        const [rows] = await pool.query("SELECT * FROM subjects WHERE subject_name LIKE '%Computer Networks%'");
        console.log('--- UPDATED SUBJECTS ---');
        console.log(JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
fix();
