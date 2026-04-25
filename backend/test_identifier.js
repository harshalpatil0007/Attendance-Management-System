const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const identifier = 5; // Tejas
        const [student] = await pool.query(`
            SELECT 
                CASE 
                    WHEN s.department IN ('CSE', 'Computer Science', 'Computer Engineering') THEN 'Computer Engineering'
                    ELSE s.department 
                END as department,
                COALESCE(NULLIF(s.current_year, ''), s.year_semester) as year, 
                s.division 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE s.prn_number = ? OR u.id = ?`, [identifier, identifier]);
        
        console.log('Student Info:', student[0]);

        if (student.length > 0) {
            const { department, year, division } = student[0];
            const [rows] = await pool.query(`
                SELECT t.*, s.subject_name 
                FROM timetables t
                JOIN subjects s ON t.subject_id = s.id
                WHERE TRIM(UPPER(t.department)) = TRIM(UPPER(?)) 
                  AND TRIM(UPPER(t.year_level)) = TRIM(UPPER(?)) 
                  AND TRIM(UPPER(t.division)) = TRIM(UPPER(?))
            `, [department, year, division]);
            console.log('Matching rows for Student 5:', rows.length);
        }
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}
test();
