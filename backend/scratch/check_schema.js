const pool = require('../config/db');

const checkSchema = async () => {
    try {
        const [cols] = await pool.query('DESCRIBE announcement_recipients');
        console.log('Table: announcement_recipients');
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
};

checkSchema();
