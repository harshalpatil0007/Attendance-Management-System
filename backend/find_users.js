const mysql = require('mysql2/promise');
async function run() {
    try {
        const c = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Pratik#1805',
            database: 'attendance_db'
        });
        const [res] = await c.execute("SELECT email FROM users WHERE role = 'admin' LIMIT 1");
        console.log('Admin Email:', res[0]?.email);
        
        const [student] = await c.execute("SELECT u.email FROM users u JOIN students s ON u.id = s.user_id WHERE s.current_year = 'TE' AND s.division = 'A' LIMIT 1");
        console.log('Student Email (TE-A):', student[0]?.email);

        await c.end();
    } catch (e) {
        console.log(e);
    }
}
run();
