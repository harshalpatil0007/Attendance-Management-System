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
        const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = "tejas@gmail.com"');
        console.log('User Record:', users);

        if (users.length > 0) {
            const userId = users[0].id;
            const [students] = await pool.query('SELECT * FROM students WHERE user_id = ?', [userId]);
            console.log('Student Record:', students[0]);

            if (students.length > 0) {
                const s = students[0];
                const [timetable] = await pool.query(`
                    SELECT count(*) as count 
                    FROM timetables 
                    WHERE department = ? AND year_level = ? AND division = ?
                `, [s.department, s.current_year || s.year_semester, s.division]);
                console.log('Timetable Matches Found:', timetable[0].count);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
