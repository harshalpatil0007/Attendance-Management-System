const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugController() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const identifier = 5; // Tejas ID

    try {
        console.log('--- Debugging getStudentWeeklySchedule Logic ---');
        const [student] = await pool.query(`
            SELECT s.department, s.current_year as year, s.division 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE s.prn_number = ? OR u.id = ?`, [identifier, identifier]);

        console.log('Student Info:', student[0]);

        if (student.length > 0) {
            const { department, year, division } = student[0];
            const [rows] = await pool.query(`
                SELECT t.*, s.subject_name, s.subject_code, u.name as teacher_name
                FROM timetables t
                JOIN subjects s ON t.subject_id = s.id
                LEFT JOIN users u ON t.teacher_id = u.id
                WHERE t.department = ? AND t.year_level = ? AND t.division = ?
                ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time ASC
            `, [department, year, division]);

            console.log('Timetable Rows Found:', rows.length);
            if (rows.length > 0) {
                console.log('First Row:', rows[0].subject_name, rows[0].day_of_week, rows[0].start_time);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

debugController();
