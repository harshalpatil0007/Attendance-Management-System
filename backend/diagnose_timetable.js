const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const identifier = 5; // Tejas
        console.log('--- Checking Student Record (ID 5) ---');
        const [student] = await pool.query('SELECT * FROM students WHERE user_id = ?', [identifier]);
        console.log(student[0]);

        if (student.length > 0) {
            const s = student[0];
            const dept = s.department;
            const year = s.current_year || s.year_semester;
            const div = s.division;

            console.log(`--- Querying with: Dept="${dept}", Year="${year}", Div="${div}" ---`);
            
            const [rows] = await pool.query(`
                SELECT t.id, t.department, t.year_level, t.division, s.subject_name 
                FROM timetables t 
                JOIN subjects s ON t.subject_id = s.id 
                WHERE t.department = ? AND t.year_level = ? AND t.division = ?
            `, [dept, year, div]);
            
            console.log('Exact Match Rows:', rows.length);

            const [fuzzyRows] = await pool.query(`
                SELECT t.id, t.department, t.year_level, t.division 
                FROM timetables t 
                WHERE TRIM(UPPER(t.department)) = TRIM(UPPER(?)) 
                  AND TRIM(UPPER(t.year_level)) = TRIM(UPPER(?)) 
                  AND TRIM(UPPER(t.division)) = TRIM(UPPER(?))
            `, [dept, year, div]);
            
            console.log('Fuzzy Match Rows:', fuzzyRows.length);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

diagnose();
