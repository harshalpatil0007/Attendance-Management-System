const pool = require('../config/db');

async function check() {
    try {
        const [students] = await pool.query("SELECT * FROM students WHERE current_year = 'TE' AND division = 'A'");
        console.log("Students found in TE-A:", students);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
