const pool = require('./config/db');

const migrate = async () => {
    try {
        console.log('Starting Admin Dashboard Database Migration...');

        const queries = [
            // 1. Update users table roles
            `ALTER TABLE users MODIFY COLUMN role ENUM('student', 'teacher', 'admin', 'hod', 'super_admin') DEFAULT 'student';`,

            // 2. Admin audit log table
            `CREATE TABLE IF NOT EXISTS admin_audit_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                admin_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            );`,

            // 3. System settings table
            `CREATE TABLE IF NOT EXISTS system_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description VARCHAR(255),
                updated_by INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            );`,

            // 4. Academic calendar table
            `CREATE TABLE IF NOT EXISTS academic_calendar (
                id INT PRIMARY KEY AUTO_INCREMENT,
                event_name VARCHAR(200) NOT NULL,
                event_type ENUM('holiday', 'exam', 'event', 'deadline') NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE,
                description TEXT,
                applicable_to JSON, -- departments, years
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );`,

            // 5. Announcements table
            `CREATE TABLE IF NOT EXISTS announcements (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                attachment_url VARCHAR(255),
                target_audience JSON, -- {departments:[], years:[]}
                is_pinned BOOLEAN DEFAULT FALSE,
                expiry_date DATE,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );`,

            // 6. Notifications table
            `CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                recipient_type ENUM('all_students', 'all_teachers', 'department', 'year', 'division', 'individual', 'parents') NOT NULL,
                recipient_filters JSON, -- stores department, year, etc.
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                channel ENUM('in_app', 'email', 'sms', 'whatsapp') NOT NULL,
                scheduled_at TIMESTAMP NULL,
                sent_at TIMESTAMP NULL,
                status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id)
            );`,

            // 7. Disciplinary records table
            `CREATE TABLE IF NOT EXISTS disciplinary_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                incident_date DATE NOT NULL,
                incident_type VARCHAR(50),
                description TEXT,
                action_taken VARCHAR(100),
                reported_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (reported_by) REFERENCES users(id)
            );`,

            // 8. Placement stats table
            `CREATE TABLE IF NOT EXISTS placement_stats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                academic_year VARCHAR(20) NOT NULL,
                company_name VARCHAR(100) NOT NULL,
                student_id INT NOT NULL,
                package_lpa DECIMAL(10,2),
                offer_date DATE,
                status ENUM('placed', 'offered', 'rejected') DEFAULT 'placed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id)
            );`,

             // 9. Placement eligibility criteria
            `CREATE TABLE IF NOT EXISTS placement_eligibility_criteria (
                id INT PRIMARY KEY AUTO_INCREMENT,
                academic_year VARCHAR(20) NOT NULL,
                min_attendance_pct DECIMAL(5,2) DEFAULT 75.0,
                max_backlogs INT DEFAULT 0,
                min_cgpa DECIMAL(4,2),
                other_criteria TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`
        ];

        for (const query of queries) {
            console.log(`Executing: ${query.substring(0, 50)}...`);
            await pool.query(query);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
