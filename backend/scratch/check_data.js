const pool = require('../config/db');

async function check() {
    try {
        const [teachers] = await pool.query("SELECT id, name FROM users WHERE role='teacher'");
        const [subjects] = await pool.query("SELECT id, subject_name FROM subjects");
        const [assignments] = await pool.query("SELECT * FROM teacher_assignments");
        
        console.log('Teachers:', JSON.stringify(teachers));
        console.log('Subjects:', JSON.stringify(subjects));
        console.log('Assignments:', JSON.stringify(assignments));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
