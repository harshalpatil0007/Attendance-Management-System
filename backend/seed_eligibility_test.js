const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedTestData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'attendease_db'
    });

    try {
        console.log('Seeding test data for placement eligibility...');

        // 1. Randomly assign backlogs and disciplinary cases to some BE students
        const [beStudents] = await pool.query("SELECT user_id FROM students WHERE current_year = 'BE'");
        
        for (const student of beStudents) {
            const backlogs = Math.floor(Math.random() * 5); // 0 to 4
            const disciplinary = Math.random() < 0.1; // 10% chance
            
            await pool.query(
                "UPDATE students SET active_backlogs = ?, has_disciplinary_case = ? WHERE user_id = ?",
                [backlogs, disciplinary, student.user_id]
            );
        }
        
        console.log(`Updated ${beStudents.length} BE students with test data.`);

        // 2. Ensure some ISE marks exist
        // (Assuming ise_marks table might be empty or sparse)
        const [iseExists] = await pool.query("SELECT id FROM ise_marks LIMIT 1");
        if (iseExists.length === 0) {
            const [subjects] = await pool.query("SELECT id FROM subjects LIMIT 5");
            for (const student of beStudents) {
                for (const sub of subjects) {
                    await pool.query(
                        "INSERT INTO ise_marks (student_id, subject_id, ise_1, ise_2, ise_3) VALUES (?, ?, ?, ?, ?)",
                        [student.user_id, sub.id, Math.random() * 20, Math.random() * 20, Math.random() * 20]
                    );
                }
            }
            console.log('Seeded mock ISE marks.');
        }

        console.log('Test data seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await pool.end();
    }
}

seedTestData();
