const pool = require('./config/db');

const fixTable = async () => {
    console.log('Fixing announcement_recipients table...');
    const connection = await pool.getConnection();
    
    try {
        // Check for missing columns
        const [cols] = await connection.query('DESCRIBE announcement_recipients');
        const colNames = cols.map(c => c.Field);
        
        if (!colNames.includes('recipient_type')) {
            console.log('Adding recipient_type column...');
            await connection.query('ALTER TABLE announcement_recipients ADD COLUMN recipient_type VARCHAR(20) DEFAULT "student" AFTER recipient_id');
        }
        
        if (!colNames.includes('is_cleared')) {
            console.log('Adding is_cleared column...');
            await connection.query('ALTER TABLE announcement_recipients ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE AFTER viewed');
        }

        if (!colNames.includes('is_notified')) {
            console.log('Adding is_notified column...');
            await connection.query('ALTER TABLE announcement_recipients ADD COLUMN is_notified BOOLEAN DEFAULT FALSE AFTER is_cleared');
        }

        if (!colNames.includes('notified_at')) {
            console.log('Adding notified_at column...');
            await connection.query('ALTER TABLE announcement_recipients ADD COLUMN notified_at TIMESTAMP NULL AFTER is_notified');
        }

        console.log('✓ announcement_recipients table checked and updated.');
    } catch (err) {
        console.error('Error fixing table:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
};

fixTable();
