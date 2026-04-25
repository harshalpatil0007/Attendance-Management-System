const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting Teacher Expertise Migration...');

        // 1. Create Labs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS labs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                lab_name VARCHAR(100) NOT NULL,
                lab_code VARCHAR(20) UNIQUE,
                department VARCHAR(50),
                capacity INT,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✓ Labs table created');

        // 2. Update Subjects table (add type and credits)
        const [cols] = await pool.query('DESCRIBE subjects');
        const hasType = cols.some(c => c.Field === 'subject_type');
        const hasActive = cols.some(c => c.Field === 'is_active');
        
        if (!hasType || !hasActive) {
            let query = 'ALTER TABLE subjects ';
            let parts = [];
            if (!hasType) {
                parts.push('ADD COLUMN subject_type ENUM(\'Theory\', \'Lab\', \'Tutorial\', \'Project\') DEFAULT \'Theory\'');
                parts.push('ADD COLUMN credits INT DEFAULT 3');
            }
            if (!hasActive) {
                parts.push('ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
            }
            await pool.query(query + parts.join(', '));
            console.log('✓ Subjects table updated with missing columns');
        }

        // 3. Create Teacher Expertise table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teacher_expertise (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                subject_id INT NOT NULL,
                proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
                years_of_experience INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_expertise (teacher_id, subject_id)
            )
        `);
        console.log('✓ Teacher expertise table created');

        // 4. Create Teacher Lab Expertise table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teacher_lab_expertise (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                lab_id INT NOT NULL,
                proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_lab_expertise (teacher_id, lab_id)
            )
        `);
        console.log('✓ Teacher lab expertise table created');

        // 5. Create Teacher Programming Skills table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teacher_programming_skills (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                language_name VARCHAR(50) NOT NULL,
                proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Teacher programming skills table created');

        // 6. Seed Labs
        const initialLabs = [
            ['Data Structures Lab (C/C++)', 'CSL301', 'Computer Science & Engineering'],
            ['DBMS Lab (SQL/PL-SQL)', 'CSL401', 'Computer Science & Engineering'],
            ['Computer Networks Lab', 'CSL402', 'Computer Science & Engineering'],
            ['Python Programming Lab', 'CSL201', 'Computer Science & Engineering'],
            ['Web Development Lab', 'CSL601', 'Computer Science & Engineering'],
            ['Machine Learning Lab', 'CSL602', 'Computer Science & Engineering'],
            ['Internet of Things (IoT) Lab', 'CSL701', 'Computer Science & Engineering'],
            ['Java Programming Lab', 'CSL501', 'Computer Science & Engineering']
        ];

        for (const lab of initialLabs) {
            await pool.query('INSERT IGNORE INTO labs (lab_name, lab_code, department) VALUES (?, ?, ?)', lab);
        }
        console.log('✓ Initial labs seeded');

        console.log('Migration Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
