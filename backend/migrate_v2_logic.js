const pool = require('./config/db');

const migrate = async () => {
    console.log('Using database pool...');
    const connection = await pool.getConnection();
    console.log('Connected to database.');

    const queries = [
        // 1. Add fields to users
        `ALTER TABLE users ADD COLUMN designation VARCHAR(100);`,
        `ALTER TABLE users ADD COLUMN employee_id VARCHAR(20) UNIQUE;`,
        `ALTER TABLE users ADD COLUMN date_of_joining DATE;`,
        `ALTER TABLE users ADD COLUMN alternate_mobile VARCHAR(20);`,

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
        `ALTER TABLE attendance_sessions ADD COLUMN lecture_type ENUM('Theory', 'Lab', 'Tutorial') DEFAULT 'Theory';`,
        `ALTER TABLE attendance_sessions ADD COLUMN room_number VARCHAR(50);`,
        `ALTER TABLE attendance_sessions ADD COLUMN qr_scans INT DEFAULT 0;`,
        `ALTER TABLE attendance_sessions ADD COLUMN face_scans INT DEFAULT 0;`,
        `ALTER TABLE attendance_sessions ADD COLUMN code_entries INT DEFAULT 0;`,
        `ALTER TABLE attendance_sessions ADD COLUMN manual_entries INT DEFAULT 0;`,
        `ALTER TABLE attendance_sessions ADD COLUMN geofence_violations INT DEFAULT 0;`,
        `ALTER TABLE attendance_sessions ADD COLUMN status ENUM('active', 'completed', 'cancelled', 'edited') DEFAULT 'active';`,
        `ALTER TABLE attendance_sessions ADD COLUMN edited_by INT;`,
        `ALTER TABLE attendance_sessions ADD COLUMN edited_at TIMESTAMP NULL;`,
        `ALTER TABLE attendance_sessions ADD COLUMN edit_reason VARCHAR(100);`,
        `ALTER TABLE attendance_sessions ADD COLUMN edit_remarks TEXT;`,

        // 8. Update attendance table
        `ALTER TABLE attendance ADD COLUMN session_id INT;`,
        `ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent';`,
        `ALTER TABLE attendance ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;`,
        `ALTER TABLE attendance ADD COLUMN edited_by INT;`,
        `ALTER TABLE attendance ADD COLUMN edit_reason VARCHAR(100);`,
        `ALTER TABLE attendance ADD COLUMN classroom_number VARCHAR(20);`,
        `ALTER TABLE attendance ADD CONSTRAINT fk_attendance_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE SET NULL;`,
        `ALTER TABLE attendance_sessions MODIFY COLUMN method_used ENUM('qr', 'code', 'manual', 'face') DEFAULT 'qr';`,

        // 9. Teacher Timetable Linkage
        `CREATE TABLE IF NOT EXISTS teacher_timetable (
            id INT PRIMARY KEY AUTO_INCREMENT,
            teacher_id INT NOT NULL,
            timetable_entry_id INT NOT NULL,
            role ENUM('Primary', 'Shared', 'Substitute') DEFAULT 'Primary',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id),
            FOREIGN KEY (timetable_entry_id) REFERENCES timetables(id),
            UNIQUE KEY unique_teacher_period (teacher_id, timetable_entry_id)
        );`,

        // 10. Teacher Availability for Substitutions
        `CREATE TABLE IF NOT EXISTS teacher_availability (
            id INT PRIMARY KEY AUTO_INCREMENT,
            teacher_id INT NOT NULL,
            day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_available BOOLEAN DEFAULT TRUE,
            availability_type ENUM('Free', 'Research', 'Admin', 'Other') DEFAULT 'Free',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id),
            UNIQUE KEY unique_availability (teacher_id, day_of_week, start_time)
        );`,

        // 11. Substitution Requests
        `CREATE TABLE IF NOT EXISTS substitution_requests (
            id INT PRIMARY KEY AUTO_INCREMENT,
            original_teacher_id INT NOT NULL,
            substitute_teacher_id INT NOT NULL,
            timetable_entry_id INT NOT NULL,
            request_date DATE NOT NULL,
            status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
            reason TEXT,
            requested_by INT NOT NULL,
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (original_teacher_id) REFERENCES users(id),
            FOREIGN KEY (substitute_teacher_id) REFERENCES users(id),
            FOREIGN KEY (timetable_entry_id) REFERENCES timetables(id),
            FOREIGN KEY (requested_by) REFERENCES users(id)
        );`,

        // 12. Face Embeddings (Initial Feature Support)
        `CREATE TABLE IF NOT EXISTS face_embeddings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            embedding_data JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE KEY unique_user_face (user_id)
        );`
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

    connection.release();
    console.log('Migration completed.');
};

module.exports = migrate;
