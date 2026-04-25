const pool = require('../config/db');

// @desc    Get all students for a teacher with filters
// @route   GET /api/teacher/students
const getTeacherStudents = async (req, res) => {
    const { subjectId, division, riskLevel, search, year } = req.query;
    const teacherId = req.user.id;

    try {
        let query = `
            SELECT 
                u.id, u.name, u.mobile_number, 
                s_data.prn_number, s_data.roll_no_in_class, s_data.division, s_data.current_year,
                sas.attendance_percentage as attendance_rate,
                (SELECT SUM(marks_obtained) FROM ise_marks_new WHERE student_id = u.id AND (subject_id = ? OR ? IS NULL) AND status = 'published' ORDER BY marks_obtained DESC LIMIT 2) as ise_sum,
                s.subject_name, s.subject_code
            FROM users u
            JOIN students s_data ON u.id = s_data.user_id
            JOIN student_enrollment se ON u.id = se.student_id
            JOIN subjects s ON se.subject_id = s.id
            LEFT JOIN student_attendance_summary sas ON u.id = sas.student_id AND s.id = sas.subject_id
            WHERE se.teacher_id = ? AND u.role = 'student'
        `;

        const params = [subjectId || null, subjectId || null, teacherId];

        if (subjectId) {
            query += ` AND se.subject_id = ?`;
            params.push(subjectId);
        }

        if (division) {
            query += ` AND s_data.division = ?`;
            params.push(division);
        }

        if (year) {
            query += ` AND s_data.current_year = ?`;
            params.push(year);
        }

        if (search) {
            query += ` AND (u.name LIKE ? OR s_data.prn_number LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (riskLevel) {
            if (riskLevel === 'critical') query += ` AND sas.attendance_percentage < 65`;
            else if (riskLevel === 'warning') query += ` AND sas.attendance_percentage >= 65 AND sas.attendance_percentage < 75`;
            else if (riskLevel === 'on-track') query += ` AND sas.attendance_percentage >= 75`;
        }

        query += ` ORDER BY u.roll_no_in_class ASC`;

        const [students] = await pool.query(query, params);

        // Summary Statistics (Respecting all filters)
        let statsQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as totalStudents,
                SUM(CASE WHEN sas.attendance_percentage >= 75 THEN 1 ELSE 0 END) as above75,
                SUM(CASE WHEN sas.attendance_percentage < 75 AND sas.attendance_percentage >= 65 THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN sas.attendance_percentage < 65 THEN 1 ELSE 0 END) as critical
            FROM users u
            JOIN students s_data ON u.id = s_data.user_id
            JOIN student_enrollment se ON u.id = se.student_id
            LEFT JOIN student_attendance_summary sas ON u.id = sas.student_id AND se.subject_id = sas.subject_id
            WHERE se.teacher_id = ? AND u.role = 'student'
        `;
        
        const statsParams = [teacherId];

        if (subjectId) {
            statsQuery += ` AND se.subject_id = ?`;
            statsParams.push(subjectId);
        }
        if (division) {
            statsQuery += ` AND s_data.division = ?`;
            statsParams.push(division);
        }
        if (year) {
            statsQuery += ` AND s_data.current_year = ?`;
            statsParams.push(year);
        }
        if (search) {
            statsQuery += ` AND (u.name LIKE ? OR s_data.prn_number LIKE ?)`;
            statsParams.push(`%${search}%`, `%${search}%`);
        }

        const [stats] = await pool.query(statsQuery, statsParams);

        res.json({
            students,
            summary: stats[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get detailed student profile for teacher
// @route   GET /api/teacher/students/:studentId
const getStudentDetails = async (req, res) => {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    try {
        // 1. Basic Profile
        const [profile] = await pool.query(`
            SELECT u.id, u.name, u.email, u.mobile_number, u.profile_image, u.role,
                   s.prn_number, s.roll_no_in_class, s.division, s.current_year, s.department, 
                   s.dob, s.blood_group, s.gender, s.local_address,
                   s.guardian_name, s.guardian_mobile, s.guardian_relation, 
                   s.emergency_contact_name, s.emergency_contact_mobile
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.id = ? AND u.role = 'student'
        `, [studentId]);

        if (profile.length === 0) return res.status(404).json({ message: 'Student not found' });

        // 2. Attendance Summary across all subjects
        const [attendance] = await pool.query(`
            SELECT s.subject_name, s.subject_code, sas.attended_classes, sas.total_classes, sas.attendance_percentage
            FROM student_attendance_summary sas
            JOIN subjects s ON sas.subject_id = s.id
            WHERE sas.student_id = ?
        `, [studentId]);

        // 3. ISE Marks (Teacher's subjects or all?)
        const [iseMarks] = await pool.query(`
            SELECT s.subject_name, s.subject_code,
                   MAX(CASE WHEN m.ise_number = 'ISE-1' THEN m.marks_obtained ELSE 0 END) as ise1,
                   MAX(CASE WHEN m.ise_number = 'ISE-2' THEN m.marks_obtained ELSE 0 END) as ise2,
                   MAX(CASE WHEN m.ise_number = 'ISE-3' THEN m.marks_obtained ELSE 0 END) as ise3
            FROM subjects s
            LEFT JOIN ise_marks_new m ON s.id = m.subject_id AND m.student_id = ? AND m.status = 'published'
            GROUP BY s.id
        `, [studentId]);

        // 4. Recent Activity (Last 10 attendance records)
        const [recentActivity] = await pool.query(`
            SELECT a.date, a.status, a.method, a.time, s.subject_name
            FROM attendance a
            JOIN subjects s ON a.subject_id = s.id
            WHERE a.student_id = ?
            ORDER BY a.date DESC, a.time DESC
            LIMIT 10
        `, [studentId]);

        // 5. Counseling Notes
        const [notes] = await pool.query(`
            SELECT * FROM counseling_notes WHERE student_id = ? ORDER BY meeting_date DESC
        `, [studentId]);

        // 6. Communication Log
        const [commLog] = await pool.query(`
            SELECT * FROM parent_communication_log WHERE student_id = ? ORDER BY communication_date DESC
        `, [studentId]);

        // 7. Certificates
        const [certificates] = await pool.query(`
            SELECT * FROM certificates WHERE student_id = ?
        `, [studentId]);

        res.json({
            profile: profile[0],
            attendance,
            iseMarks,
            recentActivity,
            notes,
            commLog,
            certificates
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add counseling note
// @route   POST /api/teacher/students/:studentId/counseling-note
const addCounselingNote = async (req, res) => {
    const { studentId } = req.params;
    const { meetingDate, reason, discussionSummary, actionItems, status } = req.body;
    const teacherId = req.user.id;

    const formattedMeetingDate = meetingDate ? new Date(meetingDate).toISOString().split('T')[0] : null;

    try {
        await pool.query(`
            INSERT INTO counseling_notes (student_id, teacher_id, meeting_date, reason, discussion_summary, action_items, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [studentId, teacherId, formattedMeetingDate, reason, discussionSummary, actionItems, status || 'pending']);

        res.json({ message: 'Counseling note added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log parent communication
// @route   POST /api/teacher/students/:studentId/communication
const logCommunication = async (req, res) => {
    const { studentId } = req.params;
    const { date, mode, person, number, subject, summary, outcome } = req.body;
    const teacherId = req.user.id;

    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : null;

    try {
        await pool.query(`
            INSERT INTO parent_communication_log (student_id, teacher_id, communication_date, mode, contact_person, contact_number, subject, summary, outcome)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [studentId, teacherId, formattedDate, mode, person, number, subject, summary, outcome]);

        res.json({ message: 'Communication logged successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTeacherStudents,
    getStudentDetails,
    addCounselingNote,
    logCommunication
};
