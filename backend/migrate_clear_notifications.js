const pool = require('./config/db');

const migrateClearNotifications = async () => {
    console.log('Starting Migration: Adding is_cleared to announcement_recipients...');
    const connection = await pool.getConnection();
    
    try {
        await connection.query(`
            ALTER TABLE announcement_recipients 
            ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration successful: is_cleared column added.');
    } catch (err) {
        // Handle case where IF NOT EXISTS might not be supported or Column already exists
        if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column is_cleared already exists, skipping.');
        } else {
            console.error('Migration failed:', err.message);
        }
    } finally {
        connection.release();
    }
};

migrateClearNotifications();
