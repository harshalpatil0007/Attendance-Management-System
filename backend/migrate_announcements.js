const pool = require('./config/db');

const migrateAnnouncements = async () => {
    console.log('Starting Announcement System Migration...');
    const connection = await pool.getConnection();
    
    const queries = [
        // 1. Main Announcements Table
        `CREATE TABLE IF NOT EXISTS announcements (
            id INT PRIMARY KEY AUTO_INCREMENT,
            sender_id INT NOT NULL,
            sender_role VARCHAR(20) DEFAULT 'teacher',
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            announcement_type ENUM('general', 'urgent', 'assignment', 'exam', 'schedule', 'marks', 'event', 'parent') DEFAULT 'general',
            priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
            target_audience ENUM('students', 'parents', 'colleagues', 'hod', 'all') DEFAULT 'students',
            subject_id INT,
            department VARCHAR(100),
            year VARCHAR(20),
            division VARCHAR(10),
            specific_recipients JSON,
            channels JSON,
            attachments JSON,
            is_scheduled BOOLEAN DEFAULT FALSE,
            scheduled_at TIMESTAMP NULL,
            expires_at TIMESTAMP NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            status ENUM('draft', 'sent', 'archived') DEFAULT 'draft',
            sent_at TIMESTAMP NULL,
            total_recipients INT DEFAULT 0,
            viewed_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );`,

        // 2. Announcement Recipients tracking
        `CREATE TABLE IF NOT EXISTS announcement_recipients (
            id INT PRIMARY KEY AUTO_INCREMENT,
            announcement_id INT NOT NULL,
            recipient_id INT NOT NULL,
            recipient_type VARCHAR(20) DEFAULT 'student',
            viewed BOOLEAN DEFAULT FALSE,
            viewed_at TIMESTAMP NULL,
            view_device VARCHAR(100),
            is_notified BOOLEAN DEFAULT FALSE,
            notified_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES users(id),
            UNIQUE KEY unique_recipient (announcement_id, recipient_id)
        );`,

        // 3. Announcement Templates
        `CREATE TABLE IF NOT EXISTS announcement_templates (
            id INT PRIMARY KEY AUTO_INCREMENT,
            teacher_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(50),
            usage_count INT DEFAULT 0,
            last_used TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id)
        );`
    ];

    try {
        for (let query of queries) {
            await connection.query(query);
            console.log('Step completed.');
        }
        console.log('Announcement tables created successfully.');
    } catch (err) {
        console.error('Migration Error:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
};

migrateAnnouncements();
