const pool = require('./backend/config/db');

async function checkSchema() {
    try {
        const tables = ['timetables', 'subjects', 'users', 'teachers', 'students', 'teacher_timetable', 'teacher_availability', 'substitution_requests'];
        
        for (const table of tables) {
            try {
                const [cols] = await pool.query(`DESCRIBE ${table}`);
                console.log(`\nTable: ${table}`);
                console.table(cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
            } catch (err) {
                console.log(`Table ${table} does not exist.`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
