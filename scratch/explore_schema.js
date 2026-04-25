require('dotenv').config({ path: './backend/.env' });
const pool = require('../backend/config/db');

async function listAllTables() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        console.log('Tables in database:', tableNames);

        for (const tableName of tableNames) {
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`\nTable: ${tableName}`);
            console.table(columns.map(c => ({
                Field: c.Field,
                Type: c.Type,
                Null: c.Null,
                Key: c.Key,
                Default: c.Default,
                Extra: c.Extra
            })));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listAllTables();
