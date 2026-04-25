const pool = require('./config/db');

const migrate = async () => {
    console.log('Starting Student Management migration...');
    const connection = await pool.getConnection();

    const queries = [
        // 1. Student Enrollment Table
        `CREATE TABLE IF NOT EXISTS student_enrollment (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            teacher_id INT NOT NULL,
            academic_year VARCHAR(10),
            semester INT,
            enrollment_date DATE DEFAULT (CURRENT_DATE),
            status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id),
            FOREIGN KEY (teacher_id) REFERENCES users(id),
            UNIQUE KEY unique_enrollment (student_id, subject_id, academic_year)
        );`,

        // 2. Student Attendance Summary
        `CREATE TABLE IF NOT EXISTS student_attendance_summary (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            total_classes INT DEFAULT 0,
            attended_classes INT DEFAULT 0,
            attendance_percentage DECIMAL(5,2) DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id),
            UNIQUE KEY unique_summary (student_id, subject_id)
        );`,

        // 3. Student ISE Summary
        `CREATE TABLE IF NOT EXISTS student_ise_summary (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            ise1_marks DECIMAL(5,2),
            ise2_marks DECIMAL(5,2),
            ise3_marks DECIMAL(5,2),
            best_two_avg DECIMAL(5,2),
            attendance_eligible BOOLEAN DEFAULT TRUE,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id),
            UNIQUE KEY unique_ise_summary (student_id, subject_id)
        );`,

        // 4. Populate Enrollment from Teacher Assignments (Initial Sync)
        `INSERT IGNORE INTO student_enrollment (student_id, subject_id, teacher_id, academic_year, semester)
         SELECT u.id, ta.subject_id, ta.teacher_id, ta.academic_year, s.semester
         FROM users u
         JOIN teacher_assignments ta ON u.department = ta.department AND u.current_year = ta.year AND u.division = ta.division
         JOIN subjects s ON ta.subject_id = s.id
         WHERE u.role = 'student';`,

        // 5. Initial Attendance Calculation
        `INSERT INTO student_attendance_summary (student_id, subject_id, total_classes, attended_classes, attendance_percentage)
         SELECT 
            student_id, 
            subject_id, 
            COUNT(*) as total, 
            SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as attended,
            (SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as percentage
         FROM attendance
         GROUP BY student_id, subject_id
         ON DUPLICATE KEY UPDATE 
            total_classes = VALUES(total_classes),
            attended_classes = VALUES(attended_classes),
            attendance_percentage = VALUES(attendance_percentage);`
    ];

    for (let query of queries) {
        try {
            await connection.query(query);
            console.log('Executed query successfully.');
        } catch (err) {
            console.error('Query failed:', query.substring(0, 50) + '...', err.message);
        }
    }

    connection.release();
    console.log('Student Management migration completed.');
};

if (require.main === module) {
    migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = migrate;
