const pool = require('../config/db');

// @desc    Get attendance sessions for a teacher with filters
// @route   GET /api/teacher/attendance/history
const getHistorySessions = async (req, res) => {
    const { subject_id, division, department, year, startDate, endDate, status } = req.query;
    const teacher_id = req.user.id;

    try {
        let query = `
            SELECT s.*, sub.subject_name, sub.subject_code
            FROM attendance_sessions s
            JOIN subjects sub ON s.subject_id = sub.id
            WHERE s.teacher_id = ?
        `;
        const params = [teacher_id];

        if (subject_id) {
            query += ' AND s.subject_id = ?';
            params.push(subject_id);
        }
        if (division) {
            query += ' AND s.division = ?';
            params.push(division);
        }
        if (year) {
            query += ' AND s.year = ?';
            params.push(year);
        }
        if (department) {
            query += ' AND s.department = ?';
            params.push(department);
        }
        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        if (startDate && endDate) {
            query += ' AND s.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY s.date DESC, s.start_time DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
};

// @desc    Get detailed stats for a single session
const getSessionDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [session] = await pool.query(`
            SELECT s.*, sub.subject_name, sub.subject_code, cl.room_number as room_name
            FROM attendance_sessions s
            JOIN subjects sub ON s.subject_id = sub.id
            LEFT JOIN classroom_locations cl ON s.room_id = cl.id
            WHERE s.id = ?
        `, [id]);

        if (session.length === 0) return res.status(404).json({ message: 'Session not found' });

        const [attendance] = await pool.query(`
            SELECT a.*, u.name, u.roll_number, u.prn_number
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            WHERE a.session_id = ?
            ORDER BY u.name ASC
        `, [id]);

        res.json({ session: session[0], attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching session details' });
    }
};

// @desc    Bulk edit attendance for a session
const updateSessionAttendance = async (req, res) => {
    const { sessionId, updates, reason, remarks } = req.body;
    const teacherId = req.user.id;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (let update of updates) {
                // update individual record
                await connection.query(`
                    UPDATE attendance 
                    SET status = ?, is_edited = TRUE, edited_by = ?, edit_reason = ?
                    WHERE session_id = ? AND student_id = ?
                `, [update.status, teacherId, reason, sessionId, update.student_id]);
            }

            // Update session summary
            const [counts] = await connection.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                FROM attendance
                WHERE session_id = ?
            `, [sessionId]);

            await connection.query(`
                UPDATE attendance_sessions 
                SET present_count = ?, absent_count = ?, late_count = ?, 
                    status = 'edited', edited_by = ?, edited_at = NOW(), edit_reason = ?, edit_remarks = ?
                WHERE id = ?
            `, [counts[0].present, counts[0].absent, counts[0].late, teacherId, reason, remarks, sessionId]);

            await connection.commit();
            res.json({ message: 'Attendance updated successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating attendance' });
    }
};

// @desc    Get attendance analytics for a subject
const getAttendanceAnalytics = async (req, res) => {
    const { subject_id, division } = req.query;
    const teacher_id = req.user.id;

    try {
        // 1. Weekly trend
        const [trend] = await pool.query(`
            SELECT 
                DATE_FORMAT(date, '%b %d') as date_label,
                AVG((present_count / total_students) * 100) as attendance_rate
            FROM attendance_sessions
            WHERE teacher_id = ? AND subject_id = ? AND division = ? AND status IN ('completed', 'edited')
            GROUP BY date
            ORDER BY date ASC
            LIMIT 10
        `, [teacher_id, subject_id, division]);

        // 2. Distribution
        const [distribution] = await pool.query(`
            SELECT 
                u.name,
                (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(asess.id)) * 100 as rate
            FROM users u
            JOIN attendance a ON u.id = a.student_id
            JOIN attendance_sessions asess ON a.session_id = asess.id
            WHERE asess.subject_id = ? AND asess.division = ?
            GROUP BY u.id
        `, [subject_id, division]);

        res.json({ trend, distribution });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

// @desc    Delete an attendance session
const deleteSession = async (req, res) => {
    const { id } = req.params;
    const teacher_id = req.user.id;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verify session belongs to the teacher
            const [session] = await connection.query(
                'SELECT id FROM attendance_sessions WHERE id = ? AND teacher_id = ?',
                [id, teacher_id]
            );

            if (session.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Session not found or unauthorized' });
            }

            // Delete attendance records
            await connection.query('DELETE FROM attendance WHERE session_id = ?', [id]);

            // Delete session
            await connection.query('DELETE FROM attendance_sessions WHERE id = ?', [id]);

            await connection.commit();
            res.json({ message: 'Session deleted successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting session' });
    }
};

// @desc    Get consolidated student attendance for a class
const getConsolidatedAttendance = async (req, res) => {
    const { subject_id, year, division, startDate, endDate } = req.query;

    if (!subject_id || !year || !division) {
        return res.status(400).json({ message: 'Subject, Year, and Division are required for student report' });
    }

    try {
        // 1. Get total sessions for this class in the range
        let sessionsQuery = `
            SELECT id FROM attendance_sessions 
            WHERE subject_id = ? AND (year = ? OR year IS NULL) AND (division = ? OR division IS NULL)
        `;
        const sessionParams = [subject_id, year, division];

        if (startDate && endDate) {
            sessionsQuery += ' AND date BETWEEN ? AND ?';
            sessionParams.push(startDate, endDate);
        }

        const [sessions] = await pool.query(sessionsQuery, sessionParams);
        const sessionIds = sessions.map(s => s.id);
        const totalSessions = sessionIds.length;

        // 2. Get all students in this class
        const [students] = await pool.query(`
            SELECT u.id, u.name, s.roll_number, s.prn_number
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE s.current_year = ? AND s.division = ?
            ORDER BY u.name ASC
        `, [year, division]);

        if (totalSessions === 0) {
            return res.json(students.map(s => ({ ...s, present_count: 0, total_sessions: 0, percentage: 0 })));
        }

        // 3. Get attendance counts for these students in these sessions
        const [attendance] = await pool.query(`
            SELECT student_id, COUNT(*) as present_count
            FROM attendance
            WHERE session_id IN (?) AND status = 'present'
            GROUP BY student_id
        `, [sessionIds]);

        const attendanceMap = {};
        attendance.forEach(a => attendanceMap[a.student_id] = a.present_count);

        const report = students.map(s => {
            const present = attendanceMap[s.id] || 0;
            return {
                ...s,
                present_count: present,
                total_sessions: totalSessions,
                percentage: ((present / totalSessions) * 100).toFixed(1)
            };
        });

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating consolidated report' });
    }
};

module.exports = {
    getHistorySessions,
    getSessionDetail,
    updateSessionAttendance,
    getAttendanceAnalytics,
    getConsolidatedAttendance,
    deleteSession
};
