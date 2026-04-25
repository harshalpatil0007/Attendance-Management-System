const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Connecting to database...');
    const connection = await pool.getConnection();

    const queries = [
        // 1. Add batch and semester to timetables
        `ALTER TABLE timetables ADD COLUMN batch VARCHAR(5);`,
        `ALTER TABLE timetables ADD COLUMN semester INT;`,

        // 2. Create batch_configuration table
        `CREATE TABLE IF NOT EXISTS batch_configuration (
            id INT PRIMARY KEY AUTO_INCREMENT,
            department VARCHAR(50) NOT NULL,
            year ENUM('FE', 'SE', 'TE', 'BE') NOT NULL,
            division CHAR(1) NOT NULL,
            semester INT NOT NULL,
            batch_name VARCHAR(5) NOT NULL, -- A1, A2, A3
            roll_from INT NOT NULL,
            roll_to INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_batch (department, year, division, semester, batch_name)
        );`,

        // 3. Update subjects table to ensure consistency (optional but recommended)
        `ALTER TABLE subjects ADD COLUMN subject_abbr VARCHAR(10);`
    ];

    for (let query of queries) {
        try {
            await connection.query(query);
            console.log('Executed query successfully.');
        } catch (err) {
            if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME' || err.errno === 1826 || err.code === 'ER_FK_DUP_NAME') {
                console.log('Constraint already exists, skipping.');
            } else {
                console.error('Query failed:', query.substring(0, 50) + '...', err.message);
            }
        }
    }

    // 4. Seed sample batch data for TE A Semester 6
    const seedBatches = [
        ['Computer Engineering', 'TE', 'A', 6, 'A1', 1, 27],
        ['Computer Engineering', 'TE', 'A', 6, 'A2', 28, 54],
        ['Computer Engineering', 'TE', 'A', 6, 'A3', 55, 81]
    ];

    for (let batch of seedBatches) {
        try {
            await connection.query(
                `INSERT INTO batch_configuration (department, year, division, semester, batch_name, roll_from, roll_to) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                batch
            );
            console.log(`Seeded batch ${batch[4]} successfully.`);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                console.log(`Batch ${batch[4]} already exists, skipping.`);
            } else {
                console.error('Seed failed:', err.message);
            }
        }
    }

    connection.release();
    await pool.end();
    console.log('Migration and Seeding completed.');
};

migrate();
