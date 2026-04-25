const pool = require('./config/db');

const fixSchema = async () => {
    console.log('Starting Announcement Schema Repair...');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        console.log('Dropping old announcement tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        await connection.query('DROP TABLE IF EXISTS announcement_recipients;');
        await connection.query('DROP TABLE IF EXISTS announcements;');
        await connection.query('DROP TABLE IF EXISTS announcement_templates;');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('Recreating tables with modern structure...');
        
        // 1. Main Announcements Table
        await connection.query(`
            CREATE TABLE announcements (
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
            );
        `);

        // 2. Announcement Recipients tracking
        await connection.query(`
            CREATE TABLE announcement_recipients (
                id INT PRIMARY KEY AUTO_INCREMENT,
                announcement_id INT NOT NULL,
                recipient_id INT NOT NULL,
                view_device VARCHAR(100),
                delivered_in_app BOOLEAN DEFAULT FALSE,
                delivered_email BOOLEAN DEFAULT FALSE,
                delivered_sms BOOLEAN DEFAULT FALSE,
                viewed BOOLEAN DEFAULT FALSE,
                viewed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_id) REFERENCES users(id),
                UNIQUE KEY unique_recipient (announcement_id, recipient_id)
            );
        `);

        // 3. Announcement Templates
        await connection.query(`
            CREATE TABLE announcement_templates (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                usage_count INT DEFAULT 0,
                last_used TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            );
        `);

        await connection.commit();
        console.log('✓ Announcement schema updated successfully.');
    } catch (err) {
        await connection.rollback();
        console.error('Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
};

fixSchema();
