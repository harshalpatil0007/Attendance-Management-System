const mysql = require('mysql2/promise');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'yourpassword',
            database: process.env.DB_NAME || 'attendance_db'
        });

        console.log('Seeding subjects...');
        const subjects = [
            ['CSE301', 'Data Structures & Algorithms', 'Computer Engineering', 3],
            ['CSE302', 'DBMS', 'Computer Engineering', 3],
            ['CSE303', 'Computer Networks', 'Computer Engineering', 3]
        ];
        
        for (const sub of subjects) {
            await connection.query(
                'INSERT IGNORE INTO subjects (subject_code, subject_name, department, semester) VALUES (?, ?, ?, ?)',
                sub
            );
        }

        console.log('Seeding classroom location...');
        await connection.query(
            'INSERT IGNORE INTO classroom_locations (id, room_number, building_name, latitude, longitude) VALUES (1, "L-101", "Main Building", 18.5204, 73.8567)'
        );

        // Get student ID (Assuming first user is student)
        const [users] = await connection.query('SELECT id, prn_number, department, current_year, division FROM users LIMIT 1');
        if (users.length > 0) {
            const studentId = users[0].id;
            const prn = users[0].prn_number || '2024CSE001';
            const dept = users[0].department || 'CSE';
            const year = users[0].current_year || 'TE';
            const div = users[0].division || 'A';

            // Ensure student has PRN for testing
            await connection.query('UPDATE users SET prn_number = ?, current_year = "TE", current_semester = 5, admission_year = "2022-2026", division = "A" WHERE id = ?', [prn, studentId]);

            console.log('Seeding ISE Marks...');
            const [subjRows] = await connection.query('SELECT id FROM subjects');
            for (const sub of subjRows) {
                await connection.query(
                    'INSERT IGNORE INTO ise_marks (student_id, subject_id, ise_1, ise_2, ise_3, is_published) VALUES (?, ?, ?, ?, ?, ?)',
                    [studentId, sub.id, Math.floor(Math.random() * 6) + 12, Math.floor(Math.random() * 6) + 10, Math.floor(Math.random() * 6) + 14, true]
                );
            }

            console.log('Seeding Timetable...');
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (let i = 0; i < subjRows.length; i++) {
                await connection.query(
                    'INSERT IGNORE INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, teacher_id, room_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [dept, year, div, days[i], '09:00:00', '10:00:00', subjRows[i].id, 1, 'L-101', 'Theory']
                );
                await connection.query(
                    'INSERT IGNORE INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, teacher_id, room_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [dept, year, div, days[i], '10:00:00', '11:00:00', subjRows[(i+1)%subjRows.length].id, 1, 'L-101', 'Theory']
                );
            }

            console.log('Seeding active attendance session...');
            await connection.query(
                'INSERT IGNORE INTO attendance_sessions (subject_id, teacher_id, room_id, date, start_time, qr_code_token, unique_code, is_active) VALUES (?, ?, ?, CURDATE(), CURTIME(), "test-qr-token", "123456", TRUE)',
                [subjRows[0].id, 1, 1]
            );
        }

        console.log('Database seeding completed.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
