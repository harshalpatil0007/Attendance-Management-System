const pool = require('../config/db');

async function seed() {
    try {
        console.log("Starting thorough seeding...");

        // 1. Ensure Prof.Ashish exists and has a profile
        const [users] = await pool.query("SELECT id FROM users WHERE name = 'Prof.Ashish'");
        if (users.length === 0) {
            console.log("Teacher Prof.Ashish not found in users.");
            return;
        }
        const teacherId = users[0].id;
        
        // Ensure teacher profile exists
        const [tProfile] = await pool.query("SELECT * FROM teachers WHERE user_id = ?", [teacherId]);
        if (tProfile.length === 0) {
            await pool.query("INSERT INTO teachers (user_id, department, designation) VALUES (?, ?, ?)", [teacherId, 'Computer Engineering', 'Assistant Professor']);
            console.log("Created teacher profile for Prof.Ashish");
        } else {
            await pool.query("UPDATE teachers SET department = 'Computer Engineering' WHERE user_id = ?", [teacherId]);
        }
        const department = 'Computer Engineering';

        // 2. Ensure Computer Networks (ID 3) matches
        await pool.query("UPDATE subjects SET subject_name = 'Computer Networks', department = ? WHERE id = 3", [department]);
        const subjectId = 3;

        // 3. Create/Update assignment
        await pool.query(`
            INSERT INTO teacher_assignments (teacher_id, subject_id, department, year, division) 
            VALUES (?, ?, ?, 'TE', 'A')
            ON DUPLICATE KEY UPDATE department = VALUES(department)
        `, [teacherId, subjectId, department]);
        console.log("Ensured assignment exists for Prof.Ashish (TE-A)");

        // 4. Add 5 dummy students
        for (let i = 1; i <= 5; i++) {
            const name = `ISE Student ${i}`;
            const email = `ise_student${i}@ssbt.edu`;
            const prn = `2024ISE00${i}`;
            
            let [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
            let studentUserId;
            if (existing.length === 0) {
                const [res] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')", [name, email, 'password123']);
                studentUserId = res.insertId;
                await pool.query("INSERT INTO students (user_id, prn_number, roll_no_in_class, department, current_year, division) VALUES (?, ?, ?, ?, 'TE', 'A')", [studentUserId, prn, i, department]);
                console.log(`Added ${name}`);
            } else {
                studentUserId = existing[0].id;
                await pool.query("UPDATE students SET department = ?, current_year = 'TE', division = 'A', roll_no_in_class = ? WHERE user_id = ?", [department, i, studentUserId]);
            }
        }

        console.log("Thorough seeding completed.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
