const mysql = require('mysql2/promise');
require('dotenv').config();

const checkData = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'yourpassword',
        database: process.env.DB_NAME || 'attendance_db'
    });

    try {
        const [subjects] = await connection.query('SELECT id, subject_name FROM subjects');
        console.log('Subjects:', subjects);

        const [sessions] = await connection.query('SELECT id, subject_id, year, division, date, status FROM attendance_sessions');
        console.log('Sessions:', sessions);

        const [attendance] = await connection.query('SELECT count(*) as count FROM attendance');
        console.log('Attendance Records Count:', attendance[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
};

checkData();
