const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Teacher@123', salt);

    try {
        console.log('--- Seeding Teachers ---');
        const teachers = [
            { name: 'Dr. A. D. Waghmare', email: 'adw@ssbt.edu.in' },
            { name: 'Dr. Shital A. Patil', email: 'sap@ssbt.edu.in' },
            { name: 'Ms. Priyanka V. Medhe', email: 'pvm@ssbt.edu.in' },
            { name: 'Ms. Ashwini A. Kakde', email: 'aak@ssbt.edu.in' },
            { name: 'Mr. Krunal C. Pawar', email: 'kcp@ssbt.edu.in' }
        ];

        const teacherIds = {};
        for (const t of teachers) {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [t.email]);
            if (existing.length === 0) {
                // Insert into users using password_hash
                const [result] = await pool.query(
                    'INSERT INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
                    [t.name, t.email, defaultPassword, 'teacher', 'Computer Engineering']
                );
                const userId = result.insertId;
                teacherIds[t.name] = userId;
                // Also insert into teachers table for relational consistency
                await pool.query('INSERT INTO teachers (user_id, department) VALUES (?, ?)', [userId, 'Computer Engineering']);
            } else {
                teacherIds[t.name] = existing[0].id;
            }
        }

        console.log('--- Seeding Subjects ---');
        const subjects = [
            { code: 'CSE601', name: 'Project Management', dept: 'Computer Engineering' },
            { code: 'CSE602', name: 'Computer Networks', dept: 'Computer Engineering' },
            { code: 'CSE603', name: 'Neural Networks', dept: 'Computer Engineering' },
            { code: 'CSE604', name: 'Design and Analysis of Algorithms', dept: 'Computer Engineering' },
            { code: 'CSE605', name: 'Operating Systems', dept: 'Computer Engineering' },
            { code: 'CSE602L', name: 'Computer Networks Lab', dept: 'Computer Engineering' },
            { code: 'CSE605L', name: 'Operating Systems Lab', dept: 'Computer Engineering' },
            { code: 'CSE604L', name: 'Design and Analysis of Algorithms Lab', dept: 'Computer Engineering' },
            { code: 'PROJ601', name: 'Minor Project (Stage-II)', dept: 'Computer Engineering' },
            { code: 'TG601', name: 'Teacher Guardian', dept: 'Computer Engineering' }
        ];

        const subjectIds = {};
        for (const s of subjects) {
            const [existing] = await pool.query('SELECT id FROM subjects WHERE subject_code = ?', [s.code]);
            if (existing.length === 0) {
                const [result] = await pool.query(
                    'INSERT INTO subjects (subject_code, subject_name, department) VALUES (?, ?, ?)',
                    [s.code, s.name, s.dept]
                );
                subjectIds[s.name] = result.insertId;
            } else {
                subjectIds[s.name] = existing[0].id;
            }
        }

        console.log('--- Clearing Old Timetable for TE A ---');
        await pool.query("DELETE FROM timetables WHERE department = 'Computer Engineering' AND year_level = 'TE' AND division = 'A'");

        console.log('--- Inserting New Schedule ---');
        const schedule = [
            // MONDAY
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 'Operating Systems Lab', teacher: 'Dr. Shital A. Patil', room: 'Lab 4', type: 'Lab' },
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 'Computer Networks Lab', teacher: 'Dr. A. D. Waghmare', room: 'Lab 8', type: 'Lab' },
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 'Design and Analysis of Algorithms Lab', teacher: 'Ms. Ashwini A. Kakde', room: 'Lab 10', type: 'Lab' },
            { day: 'Monday', start: '13:45:00', end: '14:45:00', sub: 'Operating Systems', teacher: 'Dr. Shital A. Patil', room: '115', type: 'Theory' },
            { day: 'Monday', start: '14:45:00', end: '15:45:00', sub: 'Computer Networks', teacher: 'Dr. A. D. Waghmare', room: '115', type: 'Theory' },
            { day: 'Monday', start: '15:45:00', end: '16:45:00', sub: 'Design and Analysis of Algorithms', teacher: 'Ms. Ashwini A. Kakde', room: '115', type: 'Theory' },

            // TUESDAY
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 'Operating Systems Lab', teacher: 'Dr. Shital A. Patil', room: 'Lab 4', type: 'Lab' },
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 'Computer Networks Lab', teacher: 'Dr. A. D. Waghmare', room: 'Lab 8', type: 'Lab' },
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 'Design and Analysis of Algorithms Lab', teacher: 'Ms. Ashwini A. Kakde', room: 'Lab 10', type: 'Lab' },
            { day: 'Tuesday', start: '13:45:00', end: '14:45:00', sub: 'Project Management', teacher: 'Mr. Krunal C. Pawar', room: '115', type: 'Theory' },
            { day: 'Tuesday', start: '14:45:00', end: '15:45:00', sub: 'Computer Networks', teacher: 'Dr. A. D. Waghmare', room: '115', type: 'Theory' },
            { day: 'Tuesday', start: '15:45:00', end: '16:45:00', sub: 'Operating Systems', teacher: 'Dr. Shital A. Patil', room: '115', type: 'Theory' },

            // WEDNESDAY
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 'Operating Systems Lab', teacher: 'Dr. Shital A. Patil', room: 'Lab 4', type: 'Lab' },
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 'Computer Networks Lab', teacher: 'Dr. A. D. Waghmare', room: 'Lab 8', type: 'Lab' },
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 'Design and Analysis of Algorithms Lab', teacher: 'Ms. Ashwini A. Kakde', room: 'Lab 10', type: 'Lab' },
            { day: 'Wednesday', start: '13:45:00', end: '14:45:00', sub: 'Project Management', teacher: 'Mr. Krunal C. Pawar', room: '115', type: 'Theory' },
            { day: 'Wednesday', start: '14:45:00', end: '15:45:00', sub: 'Neural Networks', teacher: 'Ms. Priyanka V. Medhe', room: '115', type: 'Theory' },
            { day: 'Wednesday', start: '15:45:00', end: '16:45:00', sub: 'Computer Networks', teacher: 'Dr. A. D. Waghmare', room: '115', type: 'Theory' },

            // THURSDAY
            { day: 'Thursday', start: '11:00:00', end: '12:00:00', sub: 'Neural Networks', teacher: 'Ms. Priyanka V. Medhe', room: '316', type: 'Theory' },
            { day: 'Thursday', start: '12:00:00', end: '13:00:00', sub: 'Project Management', teacher: 'Mr. Krunal C. Pawar', room: '316', type: 'Theory' },
            { day: 'Thursday', start: '13:45:00', end: '14:45:00', sub: 'Design and Analysis of Algorithms', teacher: 'Ms. Ashwini A. Kakde', room: '316', type: 'Theory' },
            { day: 'Thursday', start: '14:45:00', end: '17:45:00', sub: 'Minor Project (Stage-II)', teacher: null, room: '316', type: 'Theory' },

            // FRIDAY
            { day: 'Friday', start: '11:00:00', end: '12:00:00', sub: 'Neural Networks', teacher: 'Ms. Priyanka V. Medhe', room: '316', type: 'Theory' },
            { day: 'Friday', start: '12:00:00', end: '13:00:00', sub: 'Operating Systems', teacher: 'Dr. Shital A. Patil', room: '316', type: 'Theory' },
            { day: 'Friday', start: '13:45:00', end: '14:45:00', sub: 'Design and Analysis of Algorithms', teacher: 'Ms. Ashwini A. Kakde', room: '316', type: 'Theory' },
            { day: 'Friday', start: '14:45:00', end: '15:45:00', sub: 'Teacher Guardian', teacher: null, room: '316', type: 'Theory' },
            { day: 'Friday', start: '15:45:00', end: '17:45:00', sub: 'Minor Project (Stage-II)', teacher: null, room: '316', type: 'Theory' },

            // SATURDAY
            { day: 'Saturday', start: '11:00:00', end: '13:00:00', sub: 'Minor Project (Stage-II)', teacher: null, room: '316', type: 'Theory' },
            { day: 'Saturday', start: '13:45:00', end: '17:45:00', sub: 'Minor Project (Stage-II)', teacher: null, room: '316', type: 'Theory' }
        ];

        for (const item of schedule) {
            await pool.query(
                `INSERT INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, teacher_id, room_number, type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'Computer Engineering', 'TE', 'A', item.day, item.start, item.end,
                    subjectIds[item.sub], item.teacher ? teacherIds[item.teacher] : null,
                    item.room, item.type
                ]
            );
        }

        console.log('--- Seeding Completed ---');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

seed();
