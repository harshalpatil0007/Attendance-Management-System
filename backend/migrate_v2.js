const pool = require('./config/db');

const migrate = async () => {
    try {
        console.log('Using database pool...');
        const connection = await pool.getConnection();
        console.log('Connected to database.');

        const queries = [
            // 1. Add fields to users
            `ALTER TABLE users ADD COLUMN designation VARCHAR(100);`,
            `ALTER TABLE users ADD COLUMN employee_id VARCHAR(20) UNIQUE;`,

            // 2. Teacher Class Assignment
            `CREATE TABLE IF NOT EXISTS teacher_assignments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                subject_id INT NOT NULL,
                department VARCHAR(50),
                year ENUM('FE', 'SE', 'TE', 'BE'),
                division CHAR(1),
                academic_year VARCHAR(10),
                is_class_coordinator BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id),
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                UNIQUE KEY unique_assignment (teacher_id, subject_id, department, year, division, academic_year)
            );`,

            // 3. Normalized ISE Marks
            `CREATE TABLE IF NOT EXISTS ise_marks_new (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                ise_number ENUM('ISE-1', 'ISE-2', 'ISE-3') NOT NULL,
                marks_obtained DECIMAL(5,2),
                max_marks INT DEFAULT 20,
                entered_by INT NOT NULL,
                status ENUM('draft', 'published', 'locked') DEFAULT 'draft',
                attendance_eligible BOOLEAN DEFAULT TRUE,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (entered_by) REFERENCES users(id),
                UNIQUE KEY unique_ise_marks (student_id, subject_id, ise_number)
            );`,

            // 4. Update syllabus_progress
            `ALTER TABLE syllabus_progress ADD COLUMN unit_name VARCHAR(200);`,
            `ALTER TABLE syllabus_progress ADD COLUMN lecture_count INT DEFAULT 1;`,
            `ALTER TABLE syllabus_progress ADD COLUMN covered_by INT;`,

            // 5. Counseling Notes
            `CREATE TABLE IF NOT EXISTS counseling_notes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                teacher_id INT NOT NULL,
                meeting_date DATE NOT NULL,
                reason VARCHAR(100),
                discussion_summary TEXT,
                action_items TEXT,
                follow_up_date DATE,
                status ENUM('pending', 'completed', 'escalated') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            );`,

            // 6. Parent Communication Log
            `CREATE TABLE IF NOT EXISTS parent_communication_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                teacher_id INT NOT NULL,
                communication_date DATE NOT NULL,
                mode ENUM('call', 'email', 'sms', 'meeting', 'letter') NOT NULL,
                contact_person VARCHAR(100),
                contact_number VARCHAR(20),
                subject VARCHAR(200),
                summary TEXT,
                outcome VARCHAR(100),
                requires_followup BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            );`,

            // 7. Update attendance_sessions
            `ALTER TABLE attendance_sessions ADD COLUMN department VARCHAR(50);`,
            `ALTER TABLE attendance_sessions ADD COLUMN year VARCHAR(10);`,
            `ALTER TABLE attendance_sessions ADD COLUMN division CHAR(1);`,
            `ALTER TABLE attendance_sessions ADD COLUMN end_time TIME;`,
            `ALTER TABLE attendance_sessions ADD COLUMN method_used ENUM('qr', 'code', 'manual') DEFAULT 'qr';`,
            `ALTER TABLE attendance_sessions ADD COLUMN total_students INT;`,
            `ALTER TABLE attendance_sessions ADD COLUMN present_count INT;`,
            `ALTER TABLE attendance_sessions ADD COLUMN absent_count INT;`,
            `ALTER TABLE attendance_sessions ADD COLUMN late_count INT;`,
            `ALTER TABLE attendance_sessions ADD COLUMN status ENUM('active', 'completed', 'cancelled') DEFAULT 'active';`,

            // 8. Update attendance table
            `ALTER TABLE attendance ADD COLUMN session_id INT;`,
            `ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent';`
        ];

        for (let query of queries) {
            try {
                await connection.query(query);
                console.log('Executed query successfully.');
            } catch (err) {
                // MySQL Error 1060: Duplicate column name
                if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME' || err.errno === 1826 || err.code === 'ER_FK_DUP_NAME') {
                    console.log('Key already exists, skipping.');
                } else {
                    console.error('Query failed:', query.substring(0, 50) + '...', err.message);
                }
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
