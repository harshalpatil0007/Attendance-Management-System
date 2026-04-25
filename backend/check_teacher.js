const mysql = require('mysql2/promise');

async function checkTeacher() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Pratik#1805',
            database: 'attendance_db'
        });

        const [rows] = await connection.execute('SELECT u.email, t.department FROM users u JOIN teachers t ON u.id = t.user_id WHERE u.email = "xyz@gmail.com"');
        console.log('Teacher Data:');
        console.table(rows);
        
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTeacher();
