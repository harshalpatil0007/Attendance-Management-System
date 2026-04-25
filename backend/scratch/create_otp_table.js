const pool = require('../config/db');

const createTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await pool.query(query);
        console.log('otp_verifications table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
};

createTable();
