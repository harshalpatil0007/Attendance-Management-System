const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating new syllabus tables...');

        const queries = [
            `CREATE TABLE IF NOT EXISTS syllabus_units (
                id INT PRIMARY KEY AUTO_INCREMENT,
                subject_id INT NOT NULL,
                unit_number INT NOT NULL,
                unit_name VARCHAR(200) NOT NULL,
                unit_description TEXT,
                total_lectures INT DEFAULT 0,
                display_order INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_unit (subject_id, unit_number)
            );`,

            `CREATE TABLE IF NOT EXISTS syllabus_topics (
                id INT PRIMARY KEY AUTO_INCREMENT,
                unit_id INT NOT NULL,
                topic_name VARCHAR(300) NOT NULL,
                topic_description TEXT,
                is_extra BOOLEAN DEFAULT FALSE,
                topic_type ENUM('core', 'additional_concept', 'practice_session', 
                                'industry_application', 'case_study', 'prerequisite_review',
                                'advanced_topic', 'background_knowledge', 'other') DEFAULT 'core',
                importance ENUM('optional', 'recommended', 'mandatory') DEFAULT 'recommended',
                lecture_count INT DEFAULT 1,
                display_order INT,
                visible_to_students BOOLEAN DEFAULT TRUE,
                added_by INT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES syllabus_units(id) ON DELETE CASCADE,
                FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
            );`,

            `CREATE TABLE IF NOT EXISTS syllabus_progress_v2 (
                id INT PRIMARY KEY AUTO_INCREMENT,
                topic_id INT NOT NULL,
                teacher_id INT NOT NULL,
                division VARCHAR(10) NOT NULL,
                academic_year VARCHAR(10),
                status ENUM('not_started', 'teaching', 'completed') DEFAULT 'not_started',
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                teaching_duration_days INT DEFAULT 0,
                notes TEXT,
                last_updated_by INT,
                last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE KEY unique_p (topic_id, teacher_id, division, academic_year)
            );`,

            `CREATE TABLE IF NOT EXISTS syllabus_progress_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                progress_id INT NOT NULL,
                previous_status ENUM('not_started', 'teaching', 'completed'),
                new_status ENUM('not_started', 'teaching', 'completed'),
                changed_by INT NOT NULL,
                change_reason TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (progress_id) REFERENCES syllabus_progress_v2(id) ON DELETE CASCADE,
                FOREIGN KEY (changed_by) REFERENCES users(id)
            );`,

            `CREATE TABLE IF NOT EXISTS extra_topics_audit (
                id INT PRIMARY KEY AUTO_INCREMENT,
                topic_id INT NOT NULL,
                action ENUM('added', 'updated', 'deleted', 'status_changed') NOT NULL,
                action_by INT NOT NULL,
                old_value JSON,
                new_value JSON,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE,
                FOREIGN KEY (action_by) REFERENCES users(id)
            );`,

            `CREATE TABLE IF NOT EXISTS student_syllabus_notes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                topic_id INT NOT NULL,
                personal_note TEXT,
                marked_for_review BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_note (student_id, topic_id)
            );`
        ];

        for (const query of queries) {
            await connection.query(query);
        }
        console.log('Tables created successfully.');

        // DATA MIGRATION
        console.log('Migrating data from old syllabus_progress...');

        // Check if old table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'syllabus_progress'");
        if (tables.length > 0) {
            const [oldData] = await connection.query('SELECT * FROM syllabus_progress');
            console.log(`Found ${oldData.length} records to migrate.`);

            for (const row of oldData) {
                // 1. Ensure Unit exists
                let unitId;
                const [existingUnits] = await connection.query(
                    'SELECT id FROM syllabus_units WHERE subject_id = ? AND unit_number = ?',
                    [row.subject_id, row.unit_number]
                );

                if (existingUnits.length === 0) {
                    const [unitResult] = await connection.query(
                        'INSERT INTO syllabus_units (subject_id, unit_number, unit_name) VALUES (?, ?, ?)',
                        [row.subject_id, row.unit_number, row.unit_name || `Unit ${row.unit_number}`]
                    );
                    unitId = unitResult.insertId;
                } else {
                    unitId = existingUnits[0].id;
                }

                // 2. Ensure Topic exists
                let topicId;
                const [existingTopics] = await connection.query(
                    'SELECT id FROM syllabus_topics WHERE unit_id = ? AND topic_name = ?',
                    [unitId, row.topic_name]
                );

                if (existingTopics.length === 0) {
                    const [topicResult] = await connection.query(
                        'INSERT INTO syllabus_topics (unit_id, topic_name) VALUES (?, ?)',
                        [unitId, row.topic_name]
                    );
                    topicId = topicResult.insertId;
                } else {
                    topicId = existingTopics[0].id;
                }

                // 3. Create Progress Entry if it was covered
                if (row.is_covered) {
                    // We need a division and teacher_id. 
                    // For migration, we'll try to guess teacher_id from subjects table.
                    const [subject] = await connection.query('SELECT teacher_id, division FROM subjects WHERE id = ?', [row.subject_id]);
                    const teacherId = subject[0]?.teacher_id || 1; // Fallback to first user
                    const division = subject[0]?.division || 'A';

                    await connection.query(
                        `INSERT IGNORE INTO syllabus_progress_v2 
                        (topic_id, teacher_id, division, academic_year, status, completed_at, last_updated_by) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [topicId, teacherId, division, '2023-24', 'completed', row.covered_date, teacherId]
                    ).catch(err => {
                        // Ignore unique constraint errors
                        if (err.code !== 'ER_DUP_ENTRY') throw err;
                    });
                }
            }
            console.log('Data migration completed.');

            // Rename old table
            console.log('Renaming old syllabus_progress to syllabus_progress_old...');
            await connection.query('RENAME TABLE syllabus_progress TO syllabus_progress_old');
            await connection.query('RENAME TABLE syllabus_progress_v2 TO syllabus_progress');
        } else {
            console.log('No old syllabus_progress table found. Skipping migration.');
            await connection.query('RENAME TABLE syllabus_progress_v2 TO syllabus_progress');
        }

        console.log('Migration script finished successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
};

migrate();
