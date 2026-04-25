const pool = require('../config/db');

async function migrate() {
    try {
        console.log('Starting Teacher Timetable Migration...');

        const queries = [
            // 1. Teacher Timetable (Assignment/Workload) Table
            `CREATE TABLE IF NOT EXISTS teacher_timetable (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                timetable_entry_id INT NOT NULL,
                role ENUM('Primary', 'Assistant', 'Substitute') DEFAULT 'Primary',
                assigned_date DATE,
                effective_from DATE,
                effective_till DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id),
                FOREIGN KEY (timetable_entry_id) REFERENCES timetables(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                UNIQUE KEY unique_teacher_assignment (teacher_id, timetable_entry_id)
            );`,

            // 2. Teacher Availability for Substitution
            `CREATE TABLE IF NOT EXISTS teacher_availability (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                availability_type ENUM('Free', 'Prep', 'Research', 'Department', 'Meeting'),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            );`,

            // 3. Substitution Requests Table
            `CREATE TABLE IF NOT EXISTS substitution_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                original_teacher_id INT NOT NULL,
                substitute_teacher_id INT,
                timetable_entry_id INT NOT NULL,
                request_date DATE NOT NULL,
                reason TEXT,
                status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
                requested_by INT NOT NULL,
                approved_by INT,
                approved_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (original_teacher_id) REFERENCES users(id),
                FOREIGN KEY (substitute_teacher_id) REFERENCES users(id),
                FOREIGN KEY (timetable_entry_id) REFERENCES timetables(id),
                FOREIGN KEY (requested_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            );`
        ];

        for (const query of queries) {
            await pool.query(query);
            console.log('Query executed successfully.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
