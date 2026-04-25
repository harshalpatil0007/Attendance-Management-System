const pool = require('../config/db');

async function check() {
    try {
        const [teachers] = await pool.query("SELECT * FROM teachers WHERE user_id = 2");
        console.log("Teacher profile:", teachers);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
