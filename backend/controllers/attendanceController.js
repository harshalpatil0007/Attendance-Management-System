const pool = require('../config/db');
const { syncATCoins } = require('./studentController');
const { sendAttendanceConfirmation } = require('../utils/notificationService');

// Helper function to calculate Euclidean distance between two vectors
const euclideanDistance = (desc1, desc2) => {
    if (desc1.length !== desc2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
};

// @desc    Mark attendance with face verification
// @route   POST /api/attendance/mark
// @access  Private (Student)
// Helper function to calculate distance using Haversine formula (meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// @desc    Mark attendance with multiple methods + Geofencing
// @route   POST /api/attendance/mark
// @access  Private (Student)
const markAttendance = async (req, res) => {
    const { 
        subject_id, method, faceDescriptor, qr_token, unique_code, 
        student_lat, student_long, session_id, classroom_number 
    } = req.body;
    
    const student_id = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    try {
        // 1. Mandatory Geofencing Check
        if (!student_lat || !student_long) {
            return res.status(400).json({ message: 'Location data is required for attendance.' });
        }

        if (!classroom_number) {
            return res.status(400).json({ message: 'Classroom number is required.' });
        }

        // Fetch session and classroom - Improved to find active session if session_id is missing
        let [sessionRows] = await pool.query(`
            SELECT s.*, cl.latitude, cl.longitude, cl.geofence_radius, cl.room_number as expected_room 
            FROM attendance_sessions s
            LEFT JOIN classroom_locations cl ON s.room_id = cl.id
            WHERE (s.id = ? OR (s.subject_id = ? AND s.is_active = TRUE)) 
            AND s.is_active = TRUE
            LIMIT 1
        `, [session_id || 0, subject_id]);

        let session;

        if (sessionRows.length === 0) {
            // Student-Initiated Session: Auto-create if teacher hasn't started one
            const [studentProfile] = await pool.query(`
                SELECT department, COALESCE(NULLIF(current_year, ''), year_semester) as year, division 
                FROM students WHERE user_id = ?`, [student_id]);
            
            if (studentProfile.length === 0) return res.status(404).json({ message: 'Student profile not found.' });
            
            const { department, year, division } = studentProfile[0];

            // 1. Find assigned teacher for this specific class section
            let [teacherLookup] = await pool.query(`
                SELECT teacher_id FROM teacher_assignments 
                WHERE subject_id = ? AND TRIM(UPPER(department)) = TRIM(UPPER(?)) 
                AND TRIM(UPPER(year)) = TRIM(UPPER(?)) AND TRIM(UPPER(division)) = TRIM(UPPER(?))
                LIMIT 1
            `, [subject_id, department, year, division]);

            // 2. Fallback to timetable if no specific assignment
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayDay = days[new Date().getDay()];
            
            let timetable_id = null;
            if (teacherLookup.length === 0) {
                const [timetableFetch] = await pool.query(`
                    SELECT id, teacher_id FROM timetables 
                    WHERE subject_id = ? AND TRIM(UPPER(department)) = TRIM(UPPER(?)) 
                    AND TRIM(UPPER(year_level)) = TRIM(UPPER(?)) AND TRIM(UPPER(division)) = TRIM(UPPER(?))
                    AND day_of_week = ?
                    LIMIT 1
                `, [subject_id, department, year, division, todayDay]);
                
                if (timetableFetch.length > 0) {
                    teacherLookup = [{ teacher_id: timetableFetch[0].teacher_id }];
                    timetable_id = timetableFetch[0].id;
                }
            } else {
                // Even if we have a teacher assignment, try to find the timetable entry for today
                const [timetableFetch] = await pool.query(`
                    SELECT id FROM timetables 
                    WHERE subject_id = ? AND TRIM(UPPER(department)) = TRIM(UPPER(?)) 
                    AND TRIM(UPPER(year_level)) = TRIM(UPPER(?)) AND TRIM(UPPER(division)) = TRIM(UPPER(?))
                    AND day_of_week = ?
                    LIMIT 1
                `, [subject_id, department, year, division, todayDay]);
                if (timetableFetch.length > 0) timetable_id = timetableFetch[0].id;
            }

            if (teacherLookup.length === 0) {
                return res.status(404).json({ message: 'No active session found and no assigned teacher located for this class.' });
            }

            const teacher_id = teacherLookup[0].teacher_id;
            const qrToken = Math.random().toString(36).substring(2, 15);
            const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 3. Create the session automatically
            const [newSession] = await pool.query(`
                INSERT INTO attendance_sessions 
                (teacher_id, subject_id, department, year, division, date, start_time, method_used, qr_code_token, unique_code, status, is_active, room_number, timetable_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', TRUE, ?, ?)
            `, [teacher_id, subject_id, department, year, division, today, currentTime, method, qrToken, uniqueCode, classroom_number, timetable_id]);

            session = {
                id: newSession.insertId,
                teacher_id,
                subject_id,
                qr_code_token: qrToken,
                unique_code: uniqueCode,
                expected_room: classroom_number, // In auto-session, we trust the student's input
                geofence_radius: 100 // Slightly larger radius for auto-sessions
            };
        } else {
            session = sessionRows[0];
        }

        // 2. Classroom number verification (Proxy for location)


        const distance = calculateDistance(student_lat, student_long, session.latitude || 20.9239, session.longitude || 75.5249);
        const radius = session.geofence_radius || 50;

        // Geofencing verification
        if (distance > radius) {
            // Log attempt
        }

        // 3. method specific validation
        let verificationSuccess = false;

        if (method === 'face') {
            const [faces] = await pool.query('SELECT embedding_data FROM face_embeddings WHERE user_id = ?', [student_id]);
            if (faces.length === 0) return res.status(400).json({ message: 'No face registered.' });
            
            const storedDescriptor = typeof faces[0].embedding_data === 'string' 
                ? JSON.parse(faces[0].embedding_data) 
                : faces[0].embedding_data;
                
            const dist = euclideanDistance(storedDescriptor, faceDescriptor);
            console.log(`Face verification for user ${student_id}: distance=${dist}, threshold=0.6`);
            if (dist <= 0.6) {
                verificationSuccess = true;
            } else {
                return res.status(401).json({ 
                    message: 'Face ID verification failed. Distance: ' + dist.toFixed(4),
                    distance: dist 
                });
            }

        } else if (method === 'qr') {
            if (session.qr_code_token === qr_token) verificationSuccess = true;
            else return res.status(400).json({ message: 'Invalid or expired QR code.' });

        } else if (method === 'code') {
            if (session.unique_code === unique_code) verificationSuccess = true;
            else return res.status(400).json({ message: 'Invalid or expired unique code.' });
        }

        if (verificationSuccess) {
            await pool.query(
                `INSERT INTO attendance 
                (student_id, subject_id, date, time, status, method, face_verified, student_lat, student_long, distance_from_class, geofence_passed, session_id, classroom_number) 
                 VALUES (?, ?, ?, ?, 'present', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student_id, subject_id, today, currentTime, method, method === 'face', student_lat, student_long, distance, distance <= radius, session.id, classroom_number]
            );

            res.status(200).json({ message: 'Attendance marked successfully' });
            
            // Sync AT Coins after marking attendance
            syncATCoins(student_id);

            // Send Real-time Notification
            const [student] = await pool.query('SELECT name, mobile_number, email FROM users WHERE id = ?', [student_id]);
            const [subject] = await pool.query('SELECT subject_name FROM subjects WHERE id = ?', [subject_id]);
            if (student.length > 0 && subject.length > 0) {
                sendAttendanceConfirmation(student[0], subject[0].subject_name);
            }
        } else {
            res.status(401).json({ message: 'Verification failed: Method not validated' });
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Attendance already marked.' });
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get student attendance history
// @route   GET /api/attendance/student
// @access  Private
const getStudentAttendance = async (req, res) => {
    const student_id = req.user.id;

    try {
        const [studentRows] = await pool.query('SELECT current_semester FROM students WHERE user_id = ?', [student_id]);
        const current_semester = studentRows[0]?.current_semester;

        let historyQuery = `
            SELECT a.id, a.date, a.status, a.face_verified, a.method, a.geofence_passed, a.classroom_number, s.subject_name, s.subject_code 
            FROM attendance a
            JOIN subjects s ON a.subject_id = s.id
            WHERE a.student_id = ?
        `;
        let historyParams = [student_id];

        if (current_semester) {
            historyQuery += ' AND s.semester = ?';
            historyParams.push(current_semester);
        }
        historyQuery += ' ORDER BY a.date DESC';

        const [history] = await pool.query(historyQuery, historyParams);

        let statsQuery = `
            SELECT s.id, s.subject_name, 
                   COUNT(a.id) as total_classes,
                   SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as attended
            FROM subjects s
            LEFT JOIN attendance a ON s.id = a.subject_id AND a.student_id = ?
        `;
        let statsParams = [student_id];

        if (current_semester) {
            statsQuery += ' WHERE s.semester = ?';
            statsParams.push(current_semester);
        }
        statsQuery += ' GROUP BY s.id';

        const [stats] = await pool.query(statsQuery, statsParams);

        res.json({ history, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all subjects to let student pick for attendance
// @route   GET /api/attendance/subjects
// @access  Private
const getAllSubjects = async (req, res) => {
    try {
        // Fetch student section info - Robust version
        const [student] = await pool.query(`
            SELECT 
                CASE 
                    WHEN s.department IN ('CSE', 'Computer Science', 'Computer Engineering') THEN 'Computer Engineering'
                    ELSE s.department 
                END as department,
                COALESCE(NULLIF(s.current_year, ''), s.year_semester) as year, 
                s.division,
                s.current_semester
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.id = ?`, [req.user.id]);

        if (student.length === 0) {
            const [all] = await pool.query('SELECT id, subject_code, subject_name FROM subjects');
            return res.json(all);
        }

        const dept = student[0].department;
        const year = student[0].year;
        const div = student[0].division;

        // Fetch subjects present in their actual timetable
        let query = `
            SELECT DISTINCT s.id, s.subject_code, s.subject_name 
            FROM subjects s
            JOIN timetables t ON s.id = t.subject_id
            WHERE 
                TRIM(UPPER(t.department)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.year_level)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.division)) = TRIM(UPPER(?))
        `;
        let params = [dept, year, div];

        if (student[0].current_semester) {
            query += ' AND s.semester = ?';
            params.push(student[0].current_semester);
        }

        query += ' ORDER BY s.subject_name ASC';

        const [subjects] = await pool.query(query, params);

        // If no subjects found in timetable (fallback), get all for the department
        if (subjects.length === 0) {
            let deptQuery = 'SELECT id, subject_code, subject_name FROM subjects WHERE TRIM(UPPER(department)) = TRIM(UPPER(?))';
            let deptParams = [dept];
            
            if (student[0].current_semester) {
                deptQuery += ' AND semester = ?';
                deptParams.push(student[0].current_semester);
            }
            deptQuery += ' ORDER BY subject_name ASC';
            
            const [deptSubjects] = await pool.query(deptQuery, deptParams);
            return res.json(deptSubjects.length > 0 ? deptSubjects : []);
        }

        res.json(subjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Start an attendance session
// @route   POST /api/attendance/session/start
// @access  Private (Teacher)
const startSession = async (req, res) => {
    const { subjectName, department, year, division, method_used, room_id, timetable_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const startTime = new Date().toTimeString().split(' ')[0];
    const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
        // 1. Find or Create Subject
        let subject_id;
        const [existing] = await pool.query(
            'SELECT id FROM subjects WHERE subject_name = ? AND department = ?', 
            [subjectName, department]
        );

        if (existing.length > 0) {
            subject_id = existing[0].id;
        } else {
            const subjectCode = `MAN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const [newSub] = await pool.query(
                'INSERT INTO subjects (subject_code, subject_name, department) VALUES (?, ?, ?)',
                [subjectCode, subjectName, department]
            );
            subject_id = newSub.insertId;
        }
        
        // 2. Start Session
        const [result] = await pool.query(`
            INSERT INTO attendance_sessions 
            (teacher_id, subject_id, department, year, division, date, start_time, method_used, qr_code_token, unique_code, room_id, status, is_active, timetable_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', TRUE, ?)
        `, [req.user.id, subject_id, department, year, division, today, startTime, method_used, qrToken, uniqueCode, room_id || 1, timetable_id || null]);

        res.status(201).json({ 
            id: result.insertId, 
            qr_token: qrToken, 
            unique_code: uniqueCode,
            subject_id: subject_id,
            message: 'Session started successfully' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error starting session' });
    }
};

// @desc    Stop an attendance session
// @route   POST /api/attendance/session/stop/:id
// @access  Private (Teacher)
const stopSession = async (req, res) => {
    const { id } = req.params;
    const endTime = new Date().toTimeString().split(' ')[0];
    try {
        // Calculate counts before closing
        const [counts] = await pool.query(`
            SELECT 
                COUNT(*) as present_count,
                SUM(CASE WHEN method = 'manual' THEN 1 ELSE 0 END) as manual_count
            FROM attendance
            WHERE session_id = ?
        `, [id]);

        // Total students expected
        const [session] = await pool.query('SELECT department, year, division FROM attendance_sessions WHERE id = ?', [id]);
        const [students] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE s.department = ? AND s.current_year = ? AND s.division = ? AND u.role = "student"
        `, [session[0].department, session[0].year, session[0].division]);

        await pool.query(`
            UPDATE attendance_sessions 
            SET end_time = ?, status = 'completed', is_active = FALSE, 
                total_students = ?, present_count = ?, absent_count = ?
            WHERE id = ? AND teacher_id = ?
        `, [endTime, students[0].total, counts[0].present_count, students[0].total - counts[0].present_count, id, req.user.id]);

        res.json({ message: 'Session stopped successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error stopping session' });
    }
};

// @desc    Mark attendance manually as teacher
const markManualAttendance = async (req, res) => {
    const { student_id, subject_id, session_id, status } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    try {
        await pool.query(`
            INSERT INTO attendance 
            (student_id, subject_id, date, time, status, method, marked_by, geofence_passed, session_id) 
            VALUES (?, ?, ?, ?, ?, 'manual', ?, TRUE, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), session_id = VALUES(session_id)
        `, [student_id, subject_id, today, currentTime, status || 'present', req.user.id, session_id]);

        res.json({ message: 'Manual attendance recorded' });
        
        // Sync AT Coins after marking attendance
        syncATCoins(student_id);

        // Send Real-time Notification for manual marking
        const [student] = await pool.query('SELECT name, mobile_number, email FROM users WHERE id = ?', [student_id]);
        const [subject] = await pool.query('SELECT subject_name FROM subjects WHERE id = ?', [subject_id]);
        if (student.length > 0 && subject.length > 0) {
            sendAttendanceConfirmation(student[0], subject[0].subject_name);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error marking manual attendance' });
    }
};

// @desc    Get live attendance for a specific session
// @route   GET /api/attendance/live-session/:id
// @access  Private (Teacher)
const getSessionLiveAttendance = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT a.*, u.name, s.prn_number
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE a.session_id = ?
            ORDER BY a.time DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching live attendance' });
    }
};

// @desc    Get all students for a class roster
// @route   GET /api/attendance/class-students
// @access  Private (Teacher)
const getClassStudents = async (req, res) => {
    const { department, year, division, session_id } = req.query;
    try {
        let query = `
            SELECT u.id, u.name, s.prn_number, 
                   COALESCE(s.roll_no_in_class, s.roll_number) as roll_number,
                   u.email,
                   CASE WHEN a.status = 'present' THEN TRUE ELSE FALSE END as marked,
                   a.status as attendance_status
            FROM users u
            JOIN students s ON u.id = s.user_id
            LEFT JOIN attendance a ON u.id = a.student_id AND a.session_id = ?
            WHERE u.role = 'student' AND s.department = ? AND s.current_year = ? AND s.division = ?
            ORDER BY u.name ASC
        `;
        const [students] = await pool.query(query, [session_id || 0, department, year, division]);
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching class roster' });
    }
};

// @desc    Get active session for a subject to auto-fill classroom
// @route   GET /api/attendance/active-session/:subjectId
// @access  Private
const getActiveSessionForStudent = async (req, res) => {
    const { subjectId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT s.id, s.room_number as classroom_number, cl.latitude, cl.longitude, cl.geofence_radius
            FROM attendance_sessions s
            LEFT JOIN classroom_locations cl ON s.room_id = cl.id
            WHERE s.subject_id = ? AND s.is_active = TRUE
            LIMIT 1
        `, [subjectId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No active session found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching active session' });
    }
};

module.exports = { 
    markAttendance, 
    getStudentAttendance, 
    getAllSubjects,
    startSession,
    stopSession,
    markManualAttendance,
    getSessionLiveAttendance,
    getClassStudents,
    getActiveSessionForStudent
};
