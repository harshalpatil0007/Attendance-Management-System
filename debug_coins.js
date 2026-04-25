const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Pratik#1805',
    database: 'attendance_db'
});

async function debugCoins() {
    try {
        const [users] = await pool.query('SELECT id, name FROM users WHERE name LIKE "%Pratik%"');
        if (users.length === 0) {
            console.log('User Pratik not found');
            return;
        }
        const userId = users[0].id;
        console.log(`Found User: ${users[0].name} (ID: ${userId})`);

        const [student] = await pool.query('SELECT at_coins, department, current_year, division FROM students WHERE user_id = ?', [userId]);
        console.log('Student record:', student[0]);

        const [rewards] = await pool.query('SELECT * FROM subject_coin_rewards WHERE user_id = ?', [userId]);
        console.log(`Rewards in table (${rewards.length}):`, rewards);

        const [attendance] = await pool.query('SELECT subject_id, COUNT(*) as count FROM attendance WHERE student_id = ? AND status = "present" GROUP BY subject_id', [userId]);
        console.log('Attendance counts:', attendance);

        const [sessions] = await pool.query(`
            SELECT subject_id, COUNT(*) as total 
            FROM attendance_sessions 
            WHERE TRIM(UPPER(department)) = TRIM(UPPER(?)) 
            AND TRIM(UPPER(year)) = TRIM(UPPER(?)) 
            AND TRIM(UPPER(division)) = TRIM(UPPER(?))
            GROUP BY subject_id`, [student[0].department, student[0].current_year, student[0].division]);
        console.log('Relevant sessions for section:', sessions);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugCoins();
