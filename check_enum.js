const pool = require('./backend/config/db');

async function checkEnum() {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM attendance_sessions LIKE 'method_used'");
        console.log('Column Info:', rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkEnum();
