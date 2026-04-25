const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

async function seed() {
    console.log('🚀 Starting Comprehensive Seeding...');
    const salt = await bcrypt.genSalt(10);
    const teacherPassword = await bcrypt.hash('Teacher@123', salt);
    const studentPassword = await bcrypt.hash('Student@123', salt);
    const adminPassword = await bcrypt.hash('Admin@123', salt);

    try {
        // 1. Core Entities: Departments & Subjects
        console.log('--- 1. Seeding Departments & Subjects ---');
        const departments = [
            'Computer Engineering',
            'Electronics & Telecommunications Engg.',
            'Mechanical Engineering',
            'Civil Engineering',
            'Chemical Engineering',
            'Electrical Engineering',
            'First Year Engineering'
        ];

        const subjects = [
            { code: 'CSE601', name: 'Project Management', dept: 'Computer Engineering', sem: 6 },
            { code: 'CSE602', name: 'Computer Networks', dept: 'Computer Engineering', sem: 6 },
            { code: 'CSE603', name: 'Neural Networks', dept: 'Computer Engineering', sem: 6 },
            { code: 'CSE604', name: 'Design and Analysis of Algorithms', dept: 'Computer Engineering', sem: 6 },
            { code: 'CSE605', name: 'Operating Systems', dept: 'Computer Engineering', sem: 6 },
            { code: 'MECH501', name: 'Thermodynamics', dept: 'Mechanical Engineering', sem: 5 },
            { code: 'MECH502', name: 'Heat Transfer', dept: 'Mechanical Engineering', sem: 5 },
            { code: 'CIV501', name: 'Structural Design', dept: 'Civil Engineering', sem: 5 }
        ];

        for (const s of subjects) {
            await pool.query(
                'INSERT IGNORE INTO subjects (subject_code, subject_name, department, semester) VALUES (?, ?, ?, ?)',
                [s.code, s.name, s.dept, s.sem]
            );
        }

        const [subjRows] = await pool.query('SELECT * FROM subjects');
        const subjectMap = {};
        subjRows.forEach(s => subjectMap[s.subject_code] = s.id);

        // 2. Users: Admin, Teachers, Students
        console.log('--- 2. Seeding Users ---');
        
        // ADMIN
        await pool.query(
            'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Super Admin', 'admin@ssbt.edu.in', adminPassword, 'admin']
        );

        // TEACHERS
        const teachers = [
            { name: 'Dr. Shital Patil', email: 'shital.patil@ssbt.edu.in', dept: 'Computer Engineering', empId: 'EMP001' },
            { name: 'Dr. A. D. Waghmare', email: 'adw@ssbt.edu.in', dept: 'Computer Engineering', empId: 'EMP002' },
            { name: 'Prof. Rahul Gupta', email: 'rahul.gupta@ssbt.edu.in', dept: 'Mechanical Engineering', empId: 'EMP003' }
        ];

        const teacherIds = [];
        for (const t of teachers) {
            const [res] = await pool.query(
                'INSERT IGNORE INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
                [t.name, t.email, teacherPassword, 'teacher', t.dept]
            );
            
            const [user] = await pool.query('SELECT id FROM users WHERE email = ?', [t.email]);
            const userId = user[0].id;
            teacherIds.push(userId);

            await pool.query(
                'INSERT IGNORE INTO teachers (user_id, employee_id, department, designation) VALUES (?, ?, ?, ?)',
                [userId, t.empId, t.dept, 'Associate Professor']
            );
        }

        // STUDENTS (50 Students)
        console.log('--- Seeding 50 Students ---');
        const studentIds = [];
        for (let i = 1; i <= 50; i++) {
            const name = `Student ${i}`;
            const email = `student${i}@ssbt.edu.in`;
            const prn = `2022CSE${String(i).padStart(3, '0')}`;
            const dept = i <= 40 ? 'Computer Engineering' : 'Mechanical Engineering';
            const year = i <= 25 ? 'TE' : 'SE';
            const div = i % 2 === 0 ? 'A' : 'B';
            const sem = year === 'TE' ? 6 : 4;

            await pool.query(
                'INSERT IGNORE INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
                [name, email, studentPassword, 'student', dept]
            );

            const [user] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            const userId = user[0].id;
            studentIds.push(userId);

            await pool.query(
                'INSERT IGNORE INTO students (user_id, prn_number, department, current_year, division, current_semester, roll_number, at_coins) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, prn, dept, year, div, sem, `R${100+i}`, 0]
            );
        }

        // 3. Academic Relations
        console.log('--- 3. Seeding Assignments & Enrollments ---');
        // Assign Dr. Shital to OS
        await pool.query(
            'INSERT IGNORE INTO teacher_assignments (teacher_id, subject_id, department, year, division, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
            [teacherIds[0], subjectMap['CSE605'], 'Computer Engineering', 'TE', 'A', '2023-24']
        );
        // Enroll students
        await pool.query(`
            INSERT IGNORE INTO student_enrollment (student_id, subject_id, teacher_id, academic_year, semester)
            SELECT u.id, ta.subject_id, ta.teacher_id, ta.academic_year, s.semester
            FROM users u
            JOIN students st ON u.id = st.user_id
            JOIN teacher_assignments ta ON st.department = ta.department AND st.current_year = ta.year AND st.division = ta.division
            JOIN subjects s ON ta.subject_id = s.id
            WHERE u.role = 'student'
        `);

        // 4. Timetable
        console.log('--- 4. Seeding Timetable ---');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const day of days) {
            await pool.query(
                'INSERT IGNORE INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, teacher_id, room_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                ['Computer Engineering', 'TE', 'A', day, '10:00:00', '11:00:00', subjectMap['CSE605'], teacherIds[0], 'L-101', 'Theory']
            );
            await pool.query(
                'INSERT IGNORE INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, teacher_id, room_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                ['Computer Engineering', 'TE', 'A', day, '11:00:00', '12:00:00', subjectMap['CSE303'], teacherIds[1], 'L-101', 'Theory']
            );
        }

        // 5. Attendance History (Last 30 Days)
        console.log('--- 5. Seeding Attendance History (30 Days) ---');
        const [compStudents] = await pool.query('SELECT user_id FROM students WHERE department = "Computer Engineering" AND current_year = "TE" AND division = "A"');
        
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Only seed for weekdays
            if (date.getDay() === 0) continue;

            const [sessResult] = await pool.query(
                'INSERT INTO attendance_sessions (subject_id, teacher_id, date, start_time, is_active, status) VALUES (?, ?, ?, ?, ?, ?)',
                [subjectMap['CSE605'], teacherIds[0], dateStr, '10:00:00', false, 'completed']
            );
            const sessionId = sessResult.insertId;

            for (const student of compStudents) {
                // 85% attendance probability
                const isPresent = Math.random() < 0.85;
                await pool.query(
                    'INSERT IGNORE INTO attendance (student_id, session_id, subject_id, status, date) VALUES (?, ?, ?, ?, ?)',
                    [student.user_id, sessionId, subjectMap['CSE605'], isPresent ? 'present' : 'absent', dateStr]
                );
            }
        }

        // 1 Active Session for Today
        console.log('--- Seeding 1 Active Session for Today ---');
        await pool.query(
            'INSERT INTO attendance_sessions (subject_id, teacher_id, date, start_time, is_active, status, unique_code) VALUES (?, ?, CURDATE(), CURTIME(), true, "active", "999999")',
            [subjectMap['CSE605'], teacherIds[0]]
        );

        // 6. ISE Marks
        console.log('--- 6. Seeding ISE Marks ---');
        for (const student of compStudents) {
            for (const iseNum of ['ISE-1', 'ISE-2', 'ISE-3']) {
                await pool.query(
                    'INSERT IGNORE INTO ise_marks_new (student_id, subject_id, ise_number, marks_obtained, status, entered_by) VALUES (?, ?, ?, ?, ?, ?)',
                    [student.user_id, subjectMap['CSE605'], iseNum, Math.floor(Math.random() * 6) + 14, 'published', teacherIds[0]]
                );
            }
        }

        // 7. Communication: Announcements
        console.log('--- 7. Seeding Announcements ---');
        const announcements = [
            { title: 'Welcome to Term 2', content: 'We hope you have a great semester ahead.', type: 'general' },
            { title: 'Project Submission Deadline', content: 'Please submit your minor projects by Friday.', type: 'assignment' },
            { title: 'Urgent: Campus Maintenance', content: 'Main building elevator is under maintenance.', type: 'urgent' }
        ];

        for (const ann of announcements) {
            const [res] = await pool.query(
                'INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [teacherIds[0], 'teacher', ann.title, ann.content, ann.type, 'sent']
            );
            const annId = res.insertId;
            
            // Link to 10 random students
            for (let j = 0; j < 10; j++) {
                await pool.query(
                    'INSERT IGNORE INTO announcement_recipients (announcement_id, recipient_id) VALUES (?, ?)',
                    [annId, studentIds[j]]
                );
            }
        }

        // 8. Engagement: Certificates & Placement
        console.log('--- 8. Seeding Certificates & Placement ---');
        
        // Force placement_stats table to match controller/UI expectations
        await pool.query('DROP TABLE IF EXISTS placement_stats');
        await pool.query(`
            CREATE TABLE placement_stats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                year INT NOT NULL,
                department VARCHAR(100) NOT NULL,
                total_students INT,
                placed_students INT,
                avg_package DECIMAL(10,2),
                highest_package DECIMAL(10,2),
                companies JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const certs = [
            { title: 'Python for Data Science', org: 'Coursera', status: 'verified' },
            { title: 'AWS Cloud Practitioner', org: 'Amazon', status: 'pending' },
            { title: 'React Masters', org: 'Udemy', status: 'rejected' }
        ];

        for (let k = 0; k < 10; k++) {
            const cert = certs[k % 3];
            await pool.query(
                'INSERT INTO certificates (student_id, title, issuing_org, status, issue_date) VALUES (?, ?, ?, ?, CURDATE())',
                [studentIds[k], cert.title, cert.org, cert.status]
            );
        }

        const placementStats = [
            { year: 2023, total: 120, placed: 85, avg: 4.5, highest: 12, dept: 'Computer Engineering' },
            { year: 2023, total: 100, placed: 70, avg: 4.0, highest: 9, dept: 'Mechanical Engineering' },
            { year: 2022, total: 115, placed: 92, avg: 4.2, highest: 10, dept: 'Computer Engineering' },
            { year: 2021, total: 110, placed: 88, avg: 4.0, highest: 9, dept: 'Computer Engineering' }
        ];

        for (const stat of placementStats) {
            await pool.query(
                'INSERT INTO placement_stats (year, department, total_students, placed_students, avg_package, highest_package) VALUES (?, ?, ?, ?, ?, ?)',
                [stat.year, stat.dept, stat.total, stat.placed, stat.avg, stat.highest]
            );
        }

        // 9. Logistics: Counseling & Comms
        console.log('--- 9. Seeding Counseling & Logs ---');
        for (let m = 0; m < 5; m++) {
            await pool.query(
                'INSERT INTO counseling_notes (student_id, teacher_id, meeting_date, reason, status) VALUES (?, ?, CURDATE(), "Academic Guidance", "completed")',
                [studentIds[m], teacherIds[0]]
            );
            await pool.query(
                'INSERT INTO parent_communication_log (student_id, teacher_id, communication_date, mode, subject) VALUES (?, ?, CURDATE(), "call", "Attendance Discussion")',
                [studentIds[m], teacherIds[0]]
            );
        }

        // 10. Seeding Syllabus
        console.log('--- 10. Seeding Syllabus ---');
        await pool.query(
            'INSERT IGNORE INTO syllabus_units (subject_id, unit_number, unit_name) VALUES (?, ?, ?)',
            [subjectMap['CSE605'], 1, 'Introduction to OS']
        );
        const [unitRows] = await pool.query(
            'SELECT id FROM syllabus_units WHERE subject_id = ? AND unit_number = ?',
            [subjectMap['CSE605'], 1]
        );
        const unitId = unitRows[0].id;

        await pool.query(
            'INSERT IGNORE INTO syllabus_topics (unit_id, topic_name, importance) VALUES (?, ?, ?)',
            [unitId, 'Process Management', 'mandatory']
        );

        // 11. AT Coins Sync
        console.log('--- 11. Syncing AT Coins ---');
        // Simple mock of sync logic
        await pool.query('UPDATE students SET at_coins = 45 WHERE department = "Computer Engineering"');

        console.log('✅ Seeding Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seed();
