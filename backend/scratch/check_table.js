const pool = require('../config/db');

async function check() {
    try {
        const [rows] = await pool.query("SHOW TABLES LIKE 'ise_marks_new'");
        if (rows.length === 0) {
            console.log("Table ise_marks_new NOT found. Creating it...");
            await pool.query(`
                CREATE TABLE ise_marks_new (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    subject_id INT NOT NULL,
                    ise_number VARCHAR(10) NOT NULL,
                    marks_obtained DECIMAL(5,2),
                    remarks TEXT,
                    status ENUM('draft', 'published') DEFAULT 'draft',
                    entered_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_mark (student_id, subject_id, ise_number)
                )
            `);
            console.log("Table ise_marks_new created.");
        } else {
            console.log("Table ise_marks_new exists.");
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
