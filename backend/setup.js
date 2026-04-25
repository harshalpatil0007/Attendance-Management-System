const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
    try {
        console.log('Connecting to MySQL instance...');
        // initially connect without database to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'yourpassword',
        });

        const dbName = process.env.DB_NAME || 'attendance_db';

        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log('Creating tables...');

        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                roll_number VARCHAR(20) UNIQUE,
                prn_number VARCHAR(20) UNIQUE,
                department VARCHAR(50),
                year_semester VARCHAR(20),
                current_year ENUM('FE', 'SE', 'TE', 'BE'),
                division VARCHAR(20),
                roll_no_in_class VARCHAR(20),
                current_semester INT,
                admission_year VARCHAR(20),
                dob DATE,
                blood_group VARCHAR(10),
                gender VARCHAR(20),
                mobile_number VARCHAR(20),
                local_address TEXT,
                permanent_address TEXT,
                guardian_name VARCHAR(100),
                guardian_mobile VARCHAR(20),
                guardian_relation VARCHAR(50),
                emergency_contact_name VARCHAR(100),
                emergency_contact_mobile VARCHAR(20),
                emergency_contact_relation VARCHAR(50),
                medical_conditions TEXT,
                blood_donation_willingness BOOLEAN DEFAULT FALSE,
                role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
                profile_image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`,
            
            `CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                subject_code VARCHAR(20) UNIQUE NOT NULL,
                subject_name VARCHAR(100) NOT NULL,
                department VARCHAR(50),
                semester INT,
                teacher_id INT,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
            );`,

            `CREATE TABLE IF NOT EXISTS ise_marks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                ise_1 DECIMAL(5,2) DEFAULT 0,
                ise_2 DECIMAL(5,2) DEFAULT 0,
                ise_3 DECIMAL(5,2) DEFAULT 0,
                is_published BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_subject_ise (student_id, subject_id)
            );`,

            `CREATE TABLE IF NOT EXISTS timetables (
                id INT PRIMARY KEY AUTO_INCREMENT,
                department VARCHAR(50),
                year_level VARCHAR(10),
                division VARCHAR(10),
                day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                start_time TIME,
                end_time TIME,
                subject_id INT,
                teacher_id INT,
                room_number VARCHAR(50),
                type ENUM('Theory', 'Lab', 'Tutorial'),
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            );`,

            `CREATE TABLE IF NOT EXISTS classroom_locations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                room_number VARCHAR(20) NOT NULL,
                building_name VARCHAR(50),
                latitude DECIMAL(10,8) NOT NULL,
                longitude DECIMAL(11,8) NOT NULL,
                geofence_radius INT DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `CREATE TABLE IF NOT EXISTS attendance_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                subject_id INT NOT NULL,
                teacher_id INT NOT NULL,
                room_id INT,
                date DATE NOT NULL,
                start_time TIME,
                expiry_time TIMESTAMP,
                qr_code_token VARCHAR(255),
                unique_code VARCHAR(10),
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (teacher_id) REFERENCES users(id),
                FOREIGN KEY (room_id) REFERENCES classroom_locations(id)
            );`,
            
            `CREATE TABLE IF NOT EXISTS attendance (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                date DATE NOT NULL,
                time TIME,
                status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent',
                method ENUM('face', 'qr', 'code', 'manual') DEFAULT 'manual',
                marked_by INT,
                face_verified BOOLEAN DEFAULT FALSE,
                student_lat DECIMAL(10,8),
                student_long DECIMAL(11,8),
                distance_from_class DECIMAL(10,2),
                geofence_passed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
            );`,
            
            `CREATE TABLE IF NOT EXISTS certificates (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                category ENUM('Technical', 'Non-Technical', 'Internships', 'Publications', 'MOOCs') NOT NULL,
                issuing_org VARCHAR(200),
                issue_date DATE,
                file_url VARCHAR(255),
                status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                verified_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
            );`,

            `CREATE TABLE IF NOT EXISTS syllabus_progress (
                id INT PRIMARY KEY AUTO_INCREMENT,
                subject_id INT NOT NULL,
                unit_number INT,
                topic_name VARCHAR(255) NOT NULL,
                is_covered BOOLEAN DEFAULT FALSE,
                covered_date DATE,
                notes_url VARCHAR(255),
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );`,

            `CREATE TABLE IF NOT EXISTS face_embeddings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                embedding_data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,
            
            `CREATE TABLE IF NOT EXISTS students (
                user_id INT PRIMARY KEY,
                roll_number VARCHAR(20) UNIQUE,
                prn_number VARCHAR(20) UNIQUE,
                department VARCHAR(50),
                year_semester VARCHAR(20),
                current_year ENUM('FE', 'SE', 'TE', 'BE'),
                division VARCHAR(20),
                roll_no_in_class VARCHAR(20),
                current_semester INT,
                admission_year VARCHAR(20),
                dob DATE,
                blood_group VARCHAR(10),
                gender VARCHAR(20),
                local_address TEXT,
                permanent_address TEXT,
                guardian_name VARCHAR(100),
                guardian_mobile VARCHAR(20),
                guardian_relation VARCHAR(50),
                emergency_contact_name VARCHAR(100),
                emergency_contact_mobile VARCHAR(20),
                emergency_contact_relation VARCHAR(50),
                medical_conditions TEXT,
                blood_donation_willingness BOOLEAN DEFAULT FALSE,
                at_coins INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,

            `CREATE TABLE IF NOT EXISTS teachers (
                user_id INT PRIMARY KEY,
                employee_id VARCHAR(20) UNIQUE,
                department VARCHAR(50),
                designation VARCHAR(100),
                alternate_mobile VARCHAR(20),
                date_of_joining DATE,
                local_address TEXT,
                permanent_address TEXT,
                blood_group VARCHAR(10),
                specialization TEXT,
                qualification TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,

            `CREATE TABLE IF NOT EXISTS admins (
                user_id INT PRIMARY KEY,
                employee_id VARCHAR(20) UNIQUE,
                admin_level ENUM('super', 'standard') DEFAULT 'standard',
                department_access TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`

        ];

        for (let query of queries) {
            await connection.query(query);
            console.log('Executed query successfully.');
        }

        console.log('Database setup completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error setting up the database:', error);
        process.exit(1);
    }
};

setupDatabase();
