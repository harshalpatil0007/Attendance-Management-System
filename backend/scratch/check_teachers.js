const pool = require('../config/db');

async function check() {
    try {
        const [teachers] = await pool.query("SELECT id, name, role FROM users WHERE role = 'teacher'");
        console.log("Teachers found:", teachers);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
