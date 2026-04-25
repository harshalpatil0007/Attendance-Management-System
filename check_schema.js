const pool = require('./backend/config/db');

async function checkSchema() {
    try {
        const [studentCols] = await pool.query('DESCRIBE students');
        console.log('Students Table:', studentCols.map(c => c.Field));

        const [teacherCols] = await pool.query('DESCRIBE teachers');
        console.log('Teachers Table:', teacherCols.map(c => c.Field));

        const [adminCols] = await pool.query('DESCRIBE admins');
        console.log('Admins Table:', adminCols.map(c => c.Field));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
