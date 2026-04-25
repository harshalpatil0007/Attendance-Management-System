require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration: Adding is_cleared column to announcement_recipients');
        
        // Check if column exists
        const [rows] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'announcement_recipients' 
            AND COLUMN_NAME = 'is_cleared'
            AND TABLE_SCHEMA = DATABASE()
        `);

        if (rows.length === 0) {
            await pool.query(`
                ALTER TABLE announcement_recipients 
                ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE
            `);
            console.log('Column is_cleared added.');
        } else {
            console.log('Column is_cleared already exists.');
        }
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
