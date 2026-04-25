const pool = require('../config/db');

const updateSchema = async () => {
    try {
        console.log('Updating database schema for AT Coins...');
        
        // 1. Add at_coins column if it doesn't exist
        const [columns] = await pool.query(
            'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = "users" AND column_name = "at_coins" AND table_schema = ?',
            [process.env.DB_NAME || 'attendance_db']
        );

        if (columns.length === 0) {
            await pool.query('ALTER TABLE users ADD COLUMN at_coins INT DEFAULT 0');
            console.log('Added at_coins column to users table.');
        } else {
            console.log('at_coins column already exists.');
        }

        // 2. Create subject_coin_rewards table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subject_coin_rewards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                subject_id INT NOT NULL,
                rewarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_subject_reward (user_id, subject_id)
            );
        `);
        console.log('subject_coin_rewards table verified/created.');

        console.log('Database schema update completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database schema:', error);
        process.exit(1);
    }
};

updateSchema();
