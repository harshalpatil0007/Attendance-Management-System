const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Pratik#1805',
    database: 'attendance_db'
});

async function inspectData() {
    try {
        const [sessions] = await pool.query('SELECT DISTINCT department, year, division FROM attendance_sessions');
        console.log('Unique sections in attendance_sessions:', sessions);

        const [students] = await pool.query('SELECT DISTINCT department, current_year, division FROM students');
        console.log('Unique sections in students:', students);

        const [subjects] = await pool.query(`
            SELECT s.subject_name, ses.department, ses.year, ses.division, COUNT(*) as sessions
            FROM attendance_sessions ses
            JOIN subjects s ON ses.subject_id = s.id
            GROUP BY s.subject_name, ses.department, ses.year, ses.division
        `);
        console.log('Sessions by subject and section:', subjects);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectData();
