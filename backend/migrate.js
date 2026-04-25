const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'yourpassword',
            database: process.env.DB_NAME || 'attendance_db'
        });

        console.log('Altering users table...');
        const columns = [
            'ADD COLUMN IF NOT EXISTS prn_number VARCHAR(20) UNIQUE',
            'ADD COLUMN IF NOT EXISTS current_year ENUM("FE", "SE", "TE", "BE")',
            'ADD COLUMN IF NOT EXISTS roll_no_in_class VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS current_semester INT',
            'ADD COLUMN IF NOT EXISTS admission_year VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS dob DATE',
            'ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10)',
            'ADD COLUMN IF NOT EXISTS gender VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS local_address TEXT',
            'ADD COLUMN IF NOT EXISTS permanent_address TEXT',
            'ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS guardian_mobile VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS emergency_contact_mobile VARCHAR(20)',
            'ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS medical_conditions TEXT',
            'ADD COLUMN IF NOT EXISTS blood_donation_willingness BOOLEAN DEFAULT FALSE'
        ];

        for (const col of columns) {
            try {
                // MySQL doesn't natively support ADD COLUMN IF NOT EXISTS in all versions easily via standard SQL
                // So we use a try-catch for each column or check if exists via information_schema
                const colName = col.split(' ')[4];
                const [exists] = await connection.query(
                    'SELECT 1 FROM information_schema.columns WHERE table_name = "users" AND column_name = ? AND table_schema = ?',
                    [colName, process.env.DB_NAME || 'attendance_db']
                );
                
                if (exists.length === 0) {
                    await connection.query(`ALTER TABLE users ${col.replace('IF NOT EXISTS', '')}`);
                    console.log(`Added column ${colName}`);
                }
            } catch (err) {
                console.log(`Column might already exist or error adding: ${err.message}`);
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
