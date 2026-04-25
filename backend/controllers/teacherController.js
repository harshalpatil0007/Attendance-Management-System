const pool = require('../config/db');

// @desc    Get teacher profile
// @route   GET /api/teacher/profile
// @access  Private (Teacher)
const getTeacherProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.name, u.email, u.profile_image, u.mobile_number, u.role,
                    t.designation, t.employee_id, t.department, t.alternate_mobile, 
                    t.date_of_joining, t.local_address, t.permanent_address, t.blood_group 
             FROM users u
             LEFT JOIN teachers t ON u.id = t.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update teacher profile
// @route   PUT /api/teacher/profile
// @access  Private (Teacher)
const updateTeacherProfile = async (req, res) => {
    const { 
        name, mobile_number, alternate_mobile, local_address, permanent_address, 
        blood_group, designation, employee_id, department, date_of_joining, email 
    } = req.body;

    // Format date for MySQL (YYYY-MM-DD)
    const formattedJoiningDate = date_of_joining ? new Date(date_of_joining).toISOString().split('T')[0] : null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        await connection.query(
            'UPDATE users SET name = ?, email = ?, mobile_number = ? WHERE id = ?',
            [name, email, mobile_number, req.user.id]
        );

        await connection.query(
            `UPDATE teachers SET 
                alternate_mobile = ?, local_address = ?, permanent_address = ?, 
                blood_group = ?, designation = ?, employee_id = ?, department = ?, date_of_joining = ?
             WHERE user_id = ?`,
            [
                alternate_mobile, local_address, permanent_address, 
                blood_group, designation, employee_id, department, formattedJoiningDate, req.user.id
            ]
        );

        await connection.commit();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Change teacher password
// @route   PUT /api/teacher/change-password
// @access  Private (Teacher)
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');

    try {
        const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get today's schedule for teacher
// @route   GET /api/teacher/today-schedule
// @access  Private (Teacher)
const getTodaySchedule = async (req, res) => {
    try {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        const [rows] = await pool.query(`
            SELECT t.*, s.subject_name, s.subject_code
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            WHERE t.teacher_id = ? AND t.day_of_week = ?
            ORDER BY t.start_time ASC
        `, [req.user.id, today]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get assigned classes
// @route   GET /api/teacher/assigned-classes
// @access  Private (Teacher)
const getAssignedClasses = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ta.*, s.subject_name, s.subject_code
            FROM teacher_assignments ta
            JOIN subjects s ON ta.subject_id = s.id
            WHERE ta.teacher_id = ?
        `, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get dashboard metrics
// @route   GET /api/teacher/dashboard-metrics
// @access  Private (Teacher)
const getDashboardMetrics = async (req, res) => {
    try {
        // Total students across all assigned classes
        const [studentCount] = await pool.query(`
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            JOIN students s ON u.id = s.user_id
            JOIN teacher_assignments ta ON s.department = ta.department AND s.current_year = ta.year AND s.division = ta.division
            WHERE ta.teacher_id = ? AND u.role = 'student'
        `, [req.user.id]);

        // Subjects assigned
        const [subjectCount] = await pool.query(
            'SELECT COUNT(DISTINCT subject_id) as total FROM teacher_assignments WHERE teacher_id = ?',
            [req.user.id]
        );

        // Attendance stats for today
        const today = new Date().toISOString().split('T')[0];
        const [todayAttendance] = await pool.query(`
            SELECT COUNT(*) as total
            FROM attendance_sessions
            WHERE teacher_id = ? AND date = ? AND status = 'completed'
        `, [req.user.id, today]);

        const [totalClassesToday] = await pool.query(`
            SELECT COUNT(*) as total
            FROM timetables
            WHERE teacher_id = ? AND day_of_week = ?
        `, [req.user.id, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]]);

        // Average attendance
        const [avgAttendance] = await pool.query(`
            SELECT AVG((present_count / total_students) * 100) as average
            FROM attendance_sessions
            WHERE teacher_id = ? AND status = 'completed'
        `, [req.user.id]);

        // Defaulters (below 75%)
        // This is complex, but for dashboard maybe just a count
        const [defaulterCount] = await pool.query(`
            SELECT COUNT(*) as total FROM (
                SELECT a.student_id, (SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as rate
                FROM attendance a
                JOIN subjects s ON a.subject_id = s.id
                WHERE s.teacher_id = ?
                GROUP BY a.student_id, a.subject_id
                HAVING rate < 75
            ) as sub
        `, [req.user.id]);

        res.json({
            totalStudents: studentCount[0].total,
            subjectsAssigned: subjectCount[0].total,
            todayAttendanceMarked: todayAttendance[0].total,
            totalClassesToday: totalClassesToday[0].total,
            averageAttendance: parseFloat(avgAttendance[0].average || 0).toFixed(1),
            defaulterCount: defaulterCount[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Update teacher profile image
// @route   POST /api/teacher/profile-image
// @access  Private (Teacher)
const updateTeacherProfileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image' });
    }

    const imageUrl = `/uploads/profile_pics/${req.file.filename}`;

    try {
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [imageUrl, req.user.id]
        );
        res.json({ message: 'Profile image updated successfully', imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove teacher profile image
// @route   DELETE /api/teacher/profile-image
// @access  Private (Teacher)
const deleteTeacherProfileImage = async (req, res) => {
    try {
        await pool.query(
            'UPDATE users SET profile_image = NULL WHERE id = ?',
            [req.user.id]
        );
        res.json({ message: 'Profile image removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get teacher notifications
// @route   GET /api/teacher/notifications
// @access  Private (Teacher)
const getTeacherNotifications = async (req, res) => {
    try {
        // Teachers should see announcements where they are recipients (from HOD or Admin)
        // or system alerts.
        const [notifications] = await pool.query(
             `SELECT a.id, a.announcement_type as type, a.title as text, a.sent_at as time, 
                    'Bell' as icon, 'text-brand-500' as color, 'bg-brand-50' as bg, 'announcements' as tab
             FROM announcements a
             JOIN announcement_recipients ar ON a.id = ar.announcement_id
             WHERE ar.recipient_id = ? AND a.status = 'sent' AND ar.is_cleared = FALSE
             ORDER BY a.sent_at DESC LIMIT 10`,
            [req.user.id]
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error in getTeacherNotifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// @desc    Clear teacher notifications
// @route   POST /api/teacher/clear-notifications
// @access  Private (Teacher)
const clearTeacherNotifications = async (req, res) => {
    try {
        await pool.query(
            `UPDATE announcement_recipients 
             SET is_cleared = TRUE 
             WHERE recipient_id = ?`,
            [req.user.id]
        );
        res.json({ message: 'Notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTeacherProfile,
    getTodaySchedule,
    getAssignedClasses,
    getDashboardMetrics,
    updateTeacherProfile,
    changePassword,
    updateTeacherProfileImage,
    deleteTeacherProfileImage,
    getTeacherNotifications,
    clearTeacherNotifications
};
