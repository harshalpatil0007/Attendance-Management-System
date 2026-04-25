const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'attendease_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Starting Placement Eligibility Migration...');

        // 1. Placement Eligibility Rules Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS placement_eligibility_rules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                academic_year VARCHAR(10) NOT NULL,
                min_attendance DECIMAL(5,2) DEFAULT 75.00,
                max_backlogs INT DEFAULT 2,
                min_ise_avg DECIMAL(5,2) DEFAULT 50.00,
                enforce_disciplinary BOOLEAN DEFAULT TRUE,
                only_final_year BOOLEAN DEFAULT TRUE,
                updated_by INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )
        `);
        console.log('Table placement_eligibility_rules created.');

        // 2. Student Eligibility Status Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS placement_eligibility (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                academic_year VARCHAR(10),
                is_eligible BOOLEAN DEFAULT FALSE,
                attendance_percentage DECIMAL(5,2),
                active_backlogs INT,
                ise_average DECIMAL(5,2),
                has_disciplinary BOOLEAN DEFAULT FALSE,
                ineligibility_reasons JSON,
                is_exception BOOLEAN DEFAULT FALSE,
                exception_approved_by INT,
                exception_notes TEXT,
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (exception_approved_by) REFERENCES users(id),
                UNIQUE KEY unique_eligibility (student_id, academic_year)
            )
        `);
        console.log('Table placement_eligibility created.');

        // 3. Add columns to students table
        try {
            await pool.query(`ALTER TABLE students ADD COLUMN active_backlogs INT DEFAULT 0`);
        } catch (err) {
            if (err.code !== 'ER_DUP_COLUMN_NAME') console.error('Error adding active_backlogs:', err.message);
        }
        try {
            await pool.query(`ALTER TABLE students ADD COLUMN has_disciplinary_case BOOLEAN DEFAULT FALSE`);
        } catch (err) {
            if (err.code !== 'ER_DUP_COLUMN_NAME') console.error('Error adding has_disciplinary_case:', err.message);
        }
        console.log('Students table columns checked/added.');

        // 4. Seed Default Rules for current year
        const [existingRules] = await pool.query('SELECT id FROM placement_eligibility_rules WHERE academic_year = ?', ['2025-26']);
        if (existingRules.length === 0) {
            await pool.query(`
                INSERT INTO placement_eligibility_rules (academic_year, min_attendance, max_backlogs, min_ise_avg, enforce_disciplinary, only_final_year)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['2025-26', 75.00, 2, 50.00, true, true]);
            console.log('Default rules for 2025-26 seeded.');
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
