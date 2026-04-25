const pool = require('../config/db');

async function check() {
    try {
        const [assignments] = await pool.query("SELECT * FROM teacher_assignments");
        console.log("Assignments found:", assignments);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
