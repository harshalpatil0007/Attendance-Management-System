const pool = require('../config/db');

async function seed() {
    try {
        console.log("Starting seeding...");

        // 1. Find Prof. Ashish
        const [teachers] = await pool.query("SELECT u.id, t.department FROM users u LEFT JOIN teachers t ON u.id = t.user_id WHERE u.name LIKE '%Ashish%'");
        if (teachers.length === 0) {
            console.log("Teacher Prof. Ashish not found.");
            return;
        }
        const teacherId = teachers[0].id;
        const department = teachers[0].department || 'CSE';

        // 2. Find Computer Networks subject
        let [subjects] = await pool.query("SELECT id FROM subjects WHERE subject_name = 'Computer Networks'");
        let subjectId;
        if (subjects.length === 0) {
            const [res] = await pool.query("INSERT INTO subjects (subject_name, subject_code, department) VALUES (?, ?, ?)", ['Computer Networks', 'CS301', department]);
            subjectId = res.insertId;
            console.log("Created subject 'Computer Networks'");
        } else {
            subjectId = subjects[0].id;
        }

        // 3. Create assignment if not exists
        const [assignments] = await pool.query("SELECT * FROM teacher_assignments WHERE teacher_id = ? AND subject_id = ? AND year = 'TE' AND division = 'A'", [teacherId, subjectId]);
        if (assignments.length === 0) {
            await pool.query("INSERT INTO teacher_assignments (teacher_id, subject_id, department, year, division) VALUES (?, ?, ?, ?, ?)", [teacherId, subjectId, department, 'TE', 'A']);
            console.log("Created assignment for Prof. Ashish");
        }

        // 4. Create 5 students in TE-A
        for (let i = 1; i <= 5; i++) {
            const name = `Student ${i}`;
            const email = `student${i}@example.com`;
            const prn = `PRN00${i}`;
            const roll = i;

            // Check if student exists
            const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
            let studentUserId;
            if (existing.length === 0) {
                const [res] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name, email, 'hashed_password', 'student']);
                studentUserId = res.insertId;
                await pool.query("INSERT INTO students (user_id, prn_number, roll_no_in_class, department, current_year, division) VALUES (?, ?, ?, ?, ?, ?)", [studentUserId, prn, roll, department, 'TE', 'A']);
                console.log(`Created student ${name}`);
            }
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
