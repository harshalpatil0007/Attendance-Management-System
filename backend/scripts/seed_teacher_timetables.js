const pool = require('../config/db');

async function seed() {
    try {
        console.log('Seeding Teacher Timetable Assignments for Shital Patil (ID: 8)...');

        // Link existing timetable entries where she is already assigned
        const [entries] = await pool.query("SELECT id FROM timetables WHERE teacher_id = 8");
        
        for (const entry of entries) {
            await pool.query(
                "INSERT IGNORE INTO teacher_timetable (teacher_id, timetable_entry_id, role) VALUES (?, ?, ?)",
                [8, entry.id, 'Primary']
            );
        }

        // Also seed some availability for her
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const day of days) {
            await pool.query(
                "INSERT IGNORE INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, availability_type) VALUES (?, ?, ?, ?, ?)",
                [8, day, '13:45:00', '16:45:00', 'Free']
            );
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seed();
