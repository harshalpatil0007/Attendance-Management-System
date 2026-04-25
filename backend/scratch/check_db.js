const pool = require('../config/db');

async function checkTables() {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tables in database:', rows.map(r => Object.values(r)[0]));
        
        const [annDesc] = await pool.query('DESCRIBE announcements');
        console.log('Announcements table structure:', annDesc);
        
        const [recDesc] = await pool.query('DESCRIBE announcement_recipients');
        console.log('Recipients table structure:', recDesc);
        
    } catch (err) {
        console.error('Error checking tables:', err.message);
    } finally {
        process.exit();
    }
}

checkTables();
