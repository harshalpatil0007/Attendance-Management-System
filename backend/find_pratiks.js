const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Pratik#1805',
    database: 'attendance_db'
});

async function findPratiks() {
    try {
        const [users] = await pool.query('SELECT id, name, email FROM users WHERE name LIKE "%Pratik%"');
        console.log('Users found:', users);
        
        for (const u of users) {
             const [attendance] = await pool.query('SELECT subject_id, COUNT(*) as count FROM attendance WHERE student_id = ? AND status = "present" GROUP BY subject_id', [u.id]);
             console.log(`Attendance for ${u.name} (ID: ${u.id}):`, attendance);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findPratiks();
