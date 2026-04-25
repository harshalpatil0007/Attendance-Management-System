const pool = require('../config/db');

async function seedAll() {
    try {
        console.log("Starting master seeding...");

        const years = ['FE', 'SE', 'TE', 'BE'];
        const divisions = ['A', 'B', 'C'];
        const [subjects] = await pool.query("SELECT id, subject_name, department FROM subjects");
        const [teachers] = await pool.query("SELECT u.id, t.department FROM users u JOIN teachers t ON u.id = t.user_id LIMIT 1");
        
        if (teachers.length === 0) {
            console.log("No teachers found to assign subjects to.");
            return;
        }
        const defaultTeacherId = teachers[0].id;

        for (const subject of subjects) {
            console.log(`Seeding for subject: ${subject.subject_name}`);
            const dept = subject.department || 'Computer Engineering';

            for (const year of years) {
                for (const division of divisions) {
                    // 1. Ensure assignment exists
                    await pool.query(`
                        INSERT IGNORE INTO teacher_assignments (teacher_id, subject_id, department, year, division)
                        VALUES (?, ?, ?, ?, ?)
                    `, [defaultTeacherId, subject.id, dept, year, division]);

                    // 2. Add 3 students for each combination (keeping it smaller than 5 to avoid too much data)
                    for (let i = 1; i <= 3; i++) {
                        const name = `${year}-${division} Student ${i} (${subject.subject_name})`;
                        const email = `${subject.id}_${year}_${division}_s${i}@ssbt.test`;
                        const prn = `${subject.id}${year}${division}00${i}`;

                        let [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
                        let studentUserId;
                        if (existing.length === 0) {
                            const [res] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')", [name, email, 'pass123']);
                            studentUserId = res.insertId;
                            await pool.query("INSERT INTO students (user_id, prn_number, roll_no_in_class, department, current_year, division) VALUES (?, ?, ?, ?, ?, ?)", 
                                [studentUserId, prn, i, dept, year, division]);
                        }
                    }
                }
            }
        }

        console.log("Master seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Master seeding failed:", error);
        process.exit(1);
    }
}

seedAll();
