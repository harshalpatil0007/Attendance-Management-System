const pool = require('../config/db');

async function cleanAndReseed() {
    try {
        console.log("Cleaning up messy test data...");

        // 1. Delete messy test users/students
        await pool.query("DELETE FROM users WHERE email LIKE '%@ssbt.test'");
        await pool.query("DELETE FROM users WHERE name LIKE '%(%)%'");
        // Also cleanup old test students from previous attempts
        await pool.query("DELETE FROM users WHERE email LIKE 'ise_student%@ssbt.edu'");

        console.log("Cleanup done. Re-seeding clean students per class...");

        const years = ['FE', 'SE', 'TE', 'BE'];
        const divisions = ['A', 'B', 'C'];
        
        const [teachers] = await pool.query("SELECT u.id, t.department FROM users u JOIN teachers t ON u.id = t.user_id LIMIT 1");
        const defaultTeacherId = teachers[0]?.id || 2;
        const [subjects] = await pool.query("SELECT id, department FROM subjects");

        // 2. Create 10 clean students for each class (Year-Div)
        for (const year of years) {
            for (const division of divisions) {
                console.log(`Seeding class: ${year}-${division}`);
                const dept = 'Computer Engineering'; // Standard department

                for (let i = 1; i <= 10; i++) {
                    const name = `${year}-${division} Student ${i}`;
                    const email = `${year.toLowerCase()}_${division.toLowerCase()}_s${i}@ssbt.edu`;
                    const prn = `2024${year}${division}${i.toString().padStart(3, '0')}`;

                    // Insert User
                    const [res] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')", [name, email, 'pass123']);
                    const studentUserId = res.insertId;
                    
                    // Insert Student Profile
                    await pool.query("INSERT INTO students (user_id, prn_number, roll_no_in_class, department, current_year, division) VALUES (?, ?, ?, ?, ?, ?)", 
                        [studentUserId, prn, i, dept, year, division]);
                }

                // 3. Ensure assignments exist for this class for all subjects
                for (const sub of subjects) {
                    await pool.query(`
                        INSERT IGNORE INTO teacher_assignments (teacher_id, subject_id, department, year, division)
                        VALUES (?, ?, ?, ?, ?)
                    `, [defaultTeacherId, sub.id, dept, year, division]);
                }
            }
        }

        console.log("Clean re-seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Re-seeding failed:", error);
        process.exit(1);
    }
}

cleanAndReseed();
