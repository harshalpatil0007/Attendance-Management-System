const pool = require('../config/db');

async function check() {
    try {
        const [subjects] = await pool.query("SELECT id, subject_name FROM subjects");
        console.log("Subjects found:", subjects);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
