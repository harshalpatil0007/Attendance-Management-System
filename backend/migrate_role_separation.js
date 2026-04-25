const pool = require('./config/db');

const migrate = async () => {
    console.log('Starting Role Separation Migration...');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Create Students table
        console.log('Creating students table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
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
            );
        `);

        // 2. Create Teachers table
        console.log('Creating teachers table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS teachers (
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
            );
        `);

        // 3. Create Admins table
        console.log('Creating admins table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                user_id INT PRIMARY KEY,
                employee_id VARCHAR(20) UNIQUE,
                admin_level ENUM('super', 'standard') DEFAULT 'standard',
                department_access TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // 4. Migrate existing data for students
        console.log('Migrating existing student data...');
        await connection.query(`
            INSERT IGNORE INTO students (
                user_id, roll_number, prn_number, department, year_semester, current_year, 
                division, roll_no_in_class, current_semester, admission_year, 
                dob, blood_group, gender, local_address, permanent_address, 
                guardian_name, guardian_mobile, guardian_relation, 
                emergency_contact_name, emergency_contact_mobile, emergency_contact_relation, 
                medical_conditions, blood_donation_willingness
            )
            SELECT 
                id, roll_number, prn_number, department, year_semester, current_year, 
                division, roll_no_in_class, current_semester, admission_year, 
                dob, blood_group, gender, local_address, permanent_address, 
                guardian_name, guardian_mobile, guardian_relation, 
                emergency_contact_name, emergency_contact_mobile, emergency_contact_relation, 
                medical_conditions, blood_donation_willingness
            FROM users
            WHERE role = 'student';
        `);

        // 5. Migrate existing data for teachers
        console.log('Migrating existing teacher data...');
        // Note: some columns might be missing in users if they weren't added by migrate.js yet
        // but we'll try to get what we can.
        const [userCols] = await connection.query('DESCRIBE users');
        const hasEmployeeId = userCols.some(c => c.Field === 'employee_id');
        const hasDesignation = userCols.some(c => c.Field === 'designation');

        let teacherSelect = `SELECT id, department, local_address, permanent_address, blood_group FROM users WHERE role = 'teacher'`;
        if (hasEmployeeId && hasDesignation) {
            teacherSelect = `SELECT id, employee_id, department, designation, local_address, permanent_address, blood_group FROM users WHERE role = 'teacher'`;
        }

        await connection.query(`
            INSERT IGNORE INTO teachers (user_id, ${hasEmployeeId ? 'employee_id, ' : ''} department, ${hasDesignation ? 'designation, ' : ''} local_address, permanent_address, blood_group)
            ${teacherSelect};
        `);

        // 6. Migrate existing data for admins
        console.log('Migrating existing admin data...');
        await connection.query(`
            INSERT IGNORE INTO admins (user_id ${hasEmployeeId ? ', employee_id' : ''})
            SELECT id ${hasEmployeeId ? ', employee_id' : ''} FROM users WHERE role = 'admin';
        `);

        await connection.commit();
        console.log('✓ Migration completed successfully.');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
    } finally {
        connection.release();
    }
};

migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
