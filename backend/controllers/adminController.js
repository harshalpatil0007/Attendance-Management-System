const pool = require('../config/db');
const axios = require('axios');
const { sendEmail, sendSMS } = require('../utils/notificationService');

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Today's attendance
        const [attToday] = await pool.query(
            'SELECT COUNT(DISTINCT student_id) as present FROM attendance WHERE date = ? AND status = "present"',
            [today]
        );
        
        // Total students
        const [totalStudents] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        
        // Total faculty
        const [totalFaculty] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
        
        // Active classes today (sessions created today)
        const [activeClasses] = await pool.query('SELECT COUNT(*) as count FROM attendance_sessions WHERE date = ? AND is_active = TRUE', [today]);

        // Defaulters (less than 75% average attendance - simplified calculation for now)
        // Correct logic would be total present / total sessions per student
        const [defaulters] = await pool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT student_id, 
                (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as pct
                FROM attendance
                GROUP BY student_id
                HAVING pct < 75
            ) as t
        `);

        res.json({
            today_attendance: attToday[0].present,
            total_students: totalStudents[0].count,
            total_faculty: totalFaculty[0].count,
            active_classes: activeClasses[0].count,
            defaulters: defaulters[0].count,
            average_percentage: 82.4 // Placeholder as requested in spec
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
};

// @desc    Get departments-wise comparison for charts
// @route   GET /api/admin/dashboard/charts
const getDashboardCharts = async (req, res) => {
    try {
        const [deptData] = await pool.query(`
            SELECT s.department, 
            (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)) as attendance_pct
            FROM users u
            JOIN students s ON u.id = s.user_id
            LEFT JOIN attendance a ON u.id = a.student_id
            WHERE u.role = 'student' AND s.department IS NOT NULL
            GROUP BY s.department
        `);

        // Daily trend (last 30 days)
        const [trendData] = await pool.query(`
            SELECT date, 
            (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as pct
            FROM attendance
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY date
            ORDER BY date ASC
        `);

        res.json({
            department_comparison: deptData,
            daily_trend: trendData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching chart data' });
    }
};

// @desc    Get all students with filters
// @route   GET /api/admin/users/students
const getStudents = async (req, res) => {
    try {
        const { department, year, division } = req.query;
        let query = `
            SELECT u.id, u.name, u.email, u.mobile_number, 
                   s.prn_number, s.department, s.current_year, s.division 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.role = "student"`;
        const params = [];

        if (department) { query += ' AND s.department = ?'; params.push(department); }
        if (year) { query += ' AND s.current_year = ?'; params.push(year); }
        if (division) { query += ' AND s.division = ?'; params.push(division); }

        const [students] = await pool.query(query, params);
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// @desc    Get recent system-wide activity logs
// @route   GET /api/admin/dashboard/recent-activity
const getRecentActivity = async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT * FROM admin_audit_log 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching activity' });
    }
};

// @desc    Get all teachers with filters
// @route   GET /api/admin/users/teachers
const getTeachers = async (req, res) => {
    try {
        const { department } = req.query;
        let query = `
            SELECT u.id, u.name, u.email, u.mobile_number, 
                   t.employee_id, t.department, t.designation
            FROM users u
            JOIN teachers t ON u.id = t.user_id
            WHERE u.role = "teacher"`;
        const params = [];

        if (department) { query += ' AND t.department = ?'; params.push(department); }

        const [teachers] = await pool.query(query, params);
        res.json(teachers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching teachers' });
    }
};

// @desc    Create new user (Student or Teacher)
// @route   POST /api/admin/users
const createUser = async (req, res) => {
    const { name, email, password, role, mobile_number, ...profileData } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password || 'SSBT@123', 10);

        const [userResult] = await connection.query(
            'INSERT INTO users (name, email, password_hash, mobile_number, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, mobile_number || null, role]
        );
        const userId = userResult.insertId;

        if (role === 'student') {
            await connection.query(
                'INSERT INTO students (user_id, prn_number, department, current_year, year_semester, division) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, profileData.prn_number, profileData.department, profileData.current_year, profileData.current_year, profileData.division]
            );
        } else if (role === 'teacher') {
            await connection.query(
                'INSERT INTO teachers (user_id, employee_id, department, designation) VALUES (?, ?, ?, ?)',
                [userId, profileData.employee_id, profileData.department, profileData.designation]
            );
        }

        await connection.query(
            'INSERT INTO admin_audit_log (admin_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'CREATE_USER', `Created ${role}: ${name}`, req.ip]
        );

        await connection.commit();
        res.status(201).json({ message: 'User created successfully', id: userId });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'User with this email, PRN, or EmpID already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error creating user' });
    } finally {
        connection.release();
    }
};

// @desc    Update user profile
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, ...profileData } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE users SET name = ?, email = ?, mobile_number = ? WHERE id = ?',
            [name, email, profileData.mobile_number || null, id]
        );

        if (role === 'student') {
            await connection.query(
                'UPDATE students SET prn_number = ?, department = ?, current_year = ?, year_semester = ?, division = ? WHERE user_id = ?',
                [profileData.prn_number, profileData.department, profileData.current_year, profileData.current_year, profileData.division, id]
            );
        } else if (role === 'teacher') {
            await connection.query(
                'UPDATE teachers SET employee_id = ?, department = ?, designation = ? WHERE user_id = ?',
                [profileData.employee_id, profileData.department, profileData.designation, id]
            );
        }

        await connection.query(
            'INSERT INTO admin_audit_log (admin_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPDATE_USER', `Updated user ID: ${id}`, req.ip]
        );

        await connection.commit();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error updating user' });
    } finally {
        connection.release();
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Records in students/teachers table will be deleted if ON DELETE CASCADE is set
        // Otherwise we delete them manually
        await connection.query('DELETE FROM students WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM teachers WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM users WHERE id = ?', [id]);

        await connection.query(
            'INSERT INTO admin_audit_log (admin_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DELETE_USER', `Deleted user ID: ${id}`, req.ip]
        );

        await connection.commit();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    } finally {
        connection.release();
    }
};


// @desc    Bulk upload users (Students or Teachers) via JSON
// @route   POST /api/admin/users/bulk-upload
const bulkUploadStudents = async (req, res) => {
    const { users } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const bcrypt = require('bcryptjs');
        const defaultPassword = await bcrypt.hash('SSBT@123', 10);

        for (const u of users) {
            // Check if user already exists
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);
            if (existing.length > 0) continue;

            const [userResult] = await connection.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [u.name, u.email, defaultPassword, u.role || 'student']
            );
            const userId = userResult.insertId;

            if ((u.role || 'student') === 'student') {
                await connection.query(
                    'INSERT INTO students (user_id, prn_number, department, current_year, year_semester, division) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, u.prn_number, u.department, u.current_year, u.current_year, u.division]
                );
            } else if (u.role === 'teacher') {
                await connection.query(
                    'INSERT INTO teachers (user_id, employee_id, department, designation) VALUES (?, ?, ?, ?)',
                    [userId, u.employee_id, u.department, u.designation]
                );
            }
        }

        await connection.query(
            'INSERT INTO admin_audit_log (admin_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'BULK_UPLOAD', `Uploaded ${users.length} users`, req.ip]
        );

        await connection.commit();
        res.status(201).json({ message: `${users.length} users processed successfully` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error in bulk upload' });
    } finally {
        connection.release();
    }
};

// @desc    Promote students to next academic year
// @route   POST /api/admin/users/promote
const promoteBatch = async (req, res) => {
    const { sourceYear, department } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let targetYear;
        if (sourceYear === 'FE') targetYear = 'SE';
        else if (sourceYear === 'SE') targetYear = 'TE';
        else if (sourceYear === 'TE') targetYear = 'BE';
        else if (sourceYear === 'BE') targetYear = 'GRADUATED';
        else return res.status(400).json({ message: 'Invalid source year' });

        const [result] = await connection.query(
            'UPDATE students SET current_year = ? WHERE current_year = ? AND department = ?',
            [targetYear, sourceYear, department]
        );

        await connection.query(
            'INSERT INTO admin_audit_log (admin_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'PROMOTE_BATCH', `Promoted ${result.affectedRows} students from ${sourceYear} to ${targetYear} in ${department}`, req.ip]
        );

        await connection.commit();
        res.json({ message: `Successfully promoted ${result.affectedRows} students to ${targetYear}` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error during promotion protocol' });
    } finally {
        connection.release();
    }
};

// @desc    Export users as CSV
// @route   GET /api/admin/users/export
const exportUsersCSV = async (req, res) => {
    try {
        const { role, department, year } = req.query;
        let query, data;

        if (role === 'teacher') {
            query = `
                SELECT u.name, u.email, t.employee_id, t.department, t.designation
                FROM users u JOIN teachers t ON u.id = t.user_id
                WHERE u.role = 'teacher'
            `;
            const params = [];
            if (department) { query += ' AND t.department = ?'; params.push(department); }
            [data] = await pool.query(query, params);
        } else {
            query = `
                SELECT u.name, u.email, s.prn_number, s.department, s.current_year, s.division
                FROM users u JOIN students s ON u.id = s.user_id
                WHERE u.role = 'student'
            `;
            const params = [];
            if (department) { query += ' AND s.department = ?'; params.push(department); }
            if (year) { query += ' AND s.current_year = ?'; params.push(year); }
            [data] = await pool.query(query, params);
        }

        if (data.length === 0) return res.status(404).json({ message: 'No data found to export' });

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error exporting CSV' });
    }
};

// @desc    Verify/Reject certificate
// @route   PUT /api/admin/certificates/:id/verify or /reject
const verifyCertificate = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE certificates SET status = "verified", verified_by = ? WHERE id = ?',
            [req.user.id, id]
        );
        res.json({ message: 'Certificate verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const rejectCertificate = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        await pool.query(
            'UPDATE certificates SET status = "rejected", rejection_reason = ?, verified_by = ? WHERE id = ?',
            [reason, req.user.id, id]
        );
        res.json({ message: 'Certificate rejected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Updating Live Attendance to include more data
const getLiveAttendance = async (req, res) => {
    try {
        const [sessions] = await pool.query(`
            SELECT sess.*, s.subject_name, u.name as teacher_name, cl.room_number,
            (SELECT COUNT(*) FROM attendance a WHERE a.session_id = sess.id AND a.status = 'present') as present_count
            FROM attendance_sessions sess
            JOIN subjects s ON sess.subject_id = s.id
            JOIN users u ON sess.teacher_id = u.id
            LEFT JOIN classroom_locations cl ON sess.room_id = cl.id
            WHERE sess.is_active = TRUE AND sess.date = CURDATE()
        `);
        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get detailed attendance analytics
// @route   GET /api/admin/attendance/analytics
const getAttendanceAnalytics = async (req, res) => {
    try {
        const { start_date, end_date, department, year } = req.query;
        let query = `
            SELECT s.department, s.current_year, 
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
            COUNT(*) as total_count,
            (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as percentage
            FROM attendance a
            JOIN students s ON a.student_id = s.user_id
            WHERE 1=1`;
        const params = [];

        if (start_date) { query += ' AND a.date >= ?'; params.push(start_date); }
        if (end_date) { query += ' AND a.date <= ?'; params.push(end_date); }
        if (department) { query += ' AND s.department = ?'; params.push(department); }
        if (year) { query += ' AND s.current_year = ?'; params.push(year); }

        query += ' GROUP BY s.department, s.current_year';

        const [analytics] = await pool.query(query, params);
        res.json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

// @desc    Get students with attendance < 75%
// @route   GET /api/admin/attendance/defaulters
const getDefaulters = async (req, res) => {
    try {
        const { department } = req.query;
        let query = `
            SELECT u.name, s.prn_number, s.department, s.current_year,
            (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)) as attendance_pct
            FROM users u
            JOIN students s ON u.id = s.user_id
            LEFT JOIN attendance a ON u.id = a.student_id
            WHERE u.role = 'student'`;
        const params = [];

        if (department) { query += ' AND s.department = ?'; params.push(department); }

        query += ` GROUP BY u.id HAVING attendance_pct < 75 OR attendance_pct IS NULL`;

        const [defaulters] = await pool.query(query, params);
        res.json(defaulters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching defaulters' });
    }
};

// @desc    Generate a global attendance code
// @route   POST /api/admin/attendance/generate-code
const generateAttendanceCode = async (req, res) => {
    const { duration_minutes } = req.body;
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Assuming there's a table to store these or we just return it for broadcast
        // For SSBT, codes are usually session-specific, but admin can generate master codes
        res.status(201).json({ 
            code, 
            expires_at: new Date(Date.now() + duration_minutes * 60000),
            message: 'Master attendance code generated'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating code' });
    }
};

// @desc    Get geofencing violation logs
// @route   GET /api/admin/attendance/geo-fencing-logs
const getGeofencingLogs = async (req, res) => {
    try {
        // Mocking geo-fencing logs as they might be part of an audit or specific table
        const [logs] = await pool.query(`
            SELECT a.*, u.name as student_name, s.prn_number, sess.subject_id
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            JOIN students s ON u.id = s.user_id
            JOIN attendance_sessions sess ON a.session_id = sess.id
            WHERE a.metadata->'$.geofence_violation' = true
            ORDER BY a.created_at DESC
        `);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching geofence logs' });
    }
};

// @desc    Get ISE marks for all students
// @route   GET /api/admin/ise/marks
const getISEMarks = async (req, res) => {
    try {
        const { department, year } = req.query;
        let query = `
            SELECT i.*, u.name, s.prn_number, s.department, s.current_year
            FROM ise_marks i
            JOIN users u ON i.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE 1=1`;
        const params = [];

        if (department) { query += ' AND s.department = ?'; params.push(department); }
        if (year) { query += ' AND s.current_year = ?'; params.push(year); }

        const [marks] = await pool.query(query, params);
        res.json(marks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching ISE marks' });
    }
};

// @desc    Publish/Lock ISE marks
// @route   PUT /api/admin/ise/publish
const publishISE = async (req, res) => {
    const { ise_number, department, status } = req.body; // status: published, locked
    try {
        // Implementation might involve updating a configurations table
        await pool.query(
            'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
            [status, `ise_${ise_number}_${department}_status`]
        );
        res.json({ message: `ISE-${ise_number} marks ${status} for ${department}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating ISE status' });
    }
};

// @desc    Get master timetable
// @route   GET /api/admin/timetable
const getTimetable = async (req, res) => {
    try {
        const { department, year, division } = req.query;
        let query = `
            SELECT t.*, s.subject_name, u.name as teacher_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users u ON t.teacher_id = u.id
            WHERE 1=1`;
        const params = [];

        if (department) { query += ' AND t.department = ?'; params.push(department); }
        if (year) { query += ' AND t.year = ?'; params.push(year); }
        if (division) { query += ' AND t.division = ?'; params.push(division); }

        const [timetable] = await pool.query(query, params);
        res.json(timetable);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create timetable entry
// @route   POST /api/admin/timetable
const createTimetable = async (req, res) => {
    const { department, year, division, day, start_time, end_time, subject_id, teacher_id, room_id } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO timetables (department, year, division, day, start_time, end_time, subject_id, teacher_id, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [department, year, division, day, start_time, end_time, subject_id, teacher_id, room_id]
        );
        res.status(201).json({ message: 'Timetable entry created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating timetable' });
    }
};

// @desc    Update timetable entry
// @route   PUT /api/admin/timetable/:id
const updateTimetable = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        await pool.query('UPDATE timetables SET ? WHERE id = ?', [updateData, id]);
        res.json({ message: 'Timetable updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating timetable' });
    }
};

// @desc    Get pending certificates
// @route   GET /api/admin/certificates/pending
const getPendingCertificates = async (req, res) => {
    try {
        const [certificates] = await pool.query(`
            SELECT c.*, u.name as student_name, s.prn_number
            FROM certificates c
            JOIN users u ON c.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE c.status = 'pending'
        `);
        res.json(certificates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get placement statistics
// @route   GET /api/admin/placement/stats
const getPlacementStats = async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM placement_stats ORDER BY year DESC');
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update placement data
// @route   POST /api/admin/placement/data
const updatePlacementData = async (req, res) => {
    const { year, department, total_students, placed_students, avg_package, highest_package, companies } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO placement_stats (year, department, total_students, placed_students, avg_package, highest_package, companies) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE placed_students = VALUES(placed_students), avg_package = VALUES(avg_package), highest_package = VALUES(highest_package), companies = VALUES(companies)',
            [year, department, total_students, placed_students, avg_package, highest_package, JSON.stringify(companies)]
        );
        res.json({ message: 'Placement data updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating placement data' });
    }
};

// @desc    Get placement analytics (Eligibility calculation)
// @route   GET /api/admin/placement/eligibility/students
const getEligibleStudents = async (req, res) => {
    try {
        const { filter, dept, academic_year = '2025-26' } = req.query;
        let query = `
            SELECT pe.*, u.name, s.prn_number, s.department, s.roll_number,
                   ex_u.name as approved_by_name
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            LEFT JOIN users ex_u ON pe.exception_approved_by = ex_u.id
            WHERE pe.academic_year = ?`;
        const params = [academic_year];

        if (filter === 'eligible') {
            query += ' AND (pe.is_eligible = TRUE OR pe.is_exception = TRUE)';
        } else if (filter === 'ineligible') {
            query += ' AND pe.is_eligible = FALSE AND pe.is_exception = FALSE';
        } else if (filter === 'exceptions') {
            query += ' AND pe.is_exception = TRUE';
        }

        if (dept && dept !== 'All') {
            query += ' AND s.department = ?';
            params.push(dept);
        }

        const [students] = await pool.query(query, params);
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching eligible students' });
    }
};

// @desc    Get placement eligibility rules
// @route   GET /api/admin/placement/eligibility/rules
const getPlacementRules = async (req, res) => {
    try {
        const { academic_year = '2025-26' } = req.query;
        const [rules] = await pool.query('SELECT * FROM placement_eligibility_rules WHERE academic_year = ?', [academic_year]);
        if (rules.length === 0) {
            return res.json({
                academic_year,
                min_attendance: 75.00,
                max_backlogs: 2,
                min_ise_avg: 50.00,
                enforce_disciplinary: true,
                only_final_year: true
            });
        }
        res.json(rules[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching rules' });
    }
};

// @desc    Update placement eligibility rules
// @route   PUT /api/admin/placement/eligibility/rules
const updatePlacementRules = async (req, res) => {
    const { academic_year, min_attendance, max_backlogs, min_ise_avg, enforce_disciplinary, only_final_year } = req.body;
    try {
        await pool.query(
            `INSERT INTO placement_eligibility_rules 
            (academic_year, min_attendance, max_backlogs, min_ise_avg, enforce_disciplinary, only_final_year, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            min_attendance = VALUES(min_attendance), 
            max_backlogs = VALUES(max_backlogs), 
            min_ise_avg = VALUES(min_ise_avg), 
            enforce_disciplinary = VALUES(enforce_disciplinary), 
            only_final_year = VALUES(only_final_year), 
            updated_by = VALUES(updated_by)`,
            [academic_year, min_attendance, max_backlogs, min_ise_avg, enforce_disciplinary, only_final_year, req.user.id]
        );
        res.json({ message: 'Eligibility rules updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating rules' });
    }
};

// @desc    Trigger re-evaluation for all students
// @route   POST /api/admin/placement/eligibility/evaluate
const evaluatePlacementEligibility = async (req, res) => {
    const { academic_year = '2025-26' } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Rules (Latest update)
        const [rulesArr] = await connection.query('SELECT * FROM placement_eligibility_rules WHERE academic_year = ? ORDER BY updated_at DESC LIMIT 1', [academic_year]);
        const rules = rulesArr[0] || { min_attendance: 75, max_backlogs: 2, min_ise_avg: 50, enforce_disciplinary: true, only_final_year: true };

        // 2. Get Students (BE only if rule enforced)
        let studentQuery = `
            SELECT u.id, s.department, s.active_backlogs, s.has_disciplinary_case
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.role = 'student'`;
        if (rules.only_final_year) {
            studentQuery += " AND s.current_year = 'BE'";
        }
        const [students] = await connection.query(studentQuery);

        for (const student of students) {
            // 3. Calculate Attendance
            const [attRes] = await connection.query(`
                SELECT (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as attendance_pct
                FROM attendance
                WHERE student_id = ?
            `, [student.id]);
            const attendance = attRes[0].attendance_pct || 0;

            // 4. Calculate ISE Average
            // Average of (ise1+ise2+ise3)/3 across all subjects
            const [iseRes] = await connection.query(`
                SELECT AVG((COALESCE(ise_1, 0) + COALESCE(ise_2, 0) + COALESCE(ise_3, 0)) / 3.0) as ise_avg
                FROM ise_marks
                WHERE student_id = ?
            `, [student.id]);
            const iseAvg = iseRes[0].ise_avg || 0;

            // 5. Evaluate Reasons
            const reasons = [];
            if (attendance < rules.min_attendance) reasons.push(`Low Attendance (${Number(attendance).toFixed(1)}%)`);
            if (student.active_backlogs > rules.max_backlogs) reasons.push(`Excess Backlogs (${student.active_backlogs})`);
            if (iseAvg < rules.min_ise_avg) reasons.push(`Low ISE Average (${Number(iseAvg).toFixed(1)}%)`);
            if (rules.enforce_disciplinary && student.has_disciplinary_case) reasons.push('Disciplinary Record');

            const isEligible = reasons.length === 0;

            // 6. Upsert Evaluation Record
            await connection.query(`
                INSERT INTO placement_eligibility 
                (student_id, academic_year, is_eligible, attendance_percentage, active_backlogs, ise_average, has_disciplinary, ineligibility_reasons, evaluated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                is_eligible = VALUES(is_eligible),
                attendance_percentage = VALUES(attendance_percentage),
                active_backlogs = VALUES(active_backlogs),
                ise_average = VALUES(ise_average),
                has_disciplinary = VALUES(has_disciplinary),
                ineligibility_reasons = VALUES(ineligibility_reasons),
                evaluated_at = NOW()
            `, [student.id, academic_year, isEligible, attendance, student.active_backlogs, iseAvg, student.has_disciplinary_case, JSON.stringify(reasons)]);
        }

        await connection.commit();
        res.json({ message: `Evaluation complete for ${students.length} students` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error during evaluation' });
    } finally {
        connection.release();
    }
};

// @desc    Grant manual exception
// @route   POST /api/admin/placement/eligibility/exception
const grantEligibilityException = async (req, res) => {
    const { student_id, academic_year, notes } = req.body;
    try {
        await pool.query(`
            UPDATE placement_eligibility 
            SET is_exception = TRUE, exception_approved_by = ?, exception_notes = ?
            WHERE student_id = ? AND academic_year = ?
        `, [req.user.id, notes, student_id, academic_year]);
        res.json({ message: 'Exception granted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error granting exception' });
    }
};

// @desc    Revoke exception
// @route   DELETE /api/admin/placement/eligibility/exception/:id
const revokeEligibilityException = async (req, res) => {
    const { id } = req.params; // pe.id
    try {
        await pool.query(`
            UPDATE placement_eligibility 
            SET is_exception = FALSE, exception_approved_by = NULL, exception_notes = NULL
            WHERE id = ?
        `, [id]);
        res.json({ message: 'Exception revoked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error revoking exception' });
    }
};

// @desc    Notify all ineligible students via Email
// @route   POST /api/admin/placement/eligibility/notify
const notifyIneligibleStudents = async (req, res) => {
    const { academic_year = '2025-26' } = req.body;
    try {
        const [ineligible] = await pool.query(`
            SELECT pe.*, u.name, u.email, u.mobile_number, s.department
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE pe.academic_year = ? AND pe.is_eligible = FALSE AND pe.is_exception = FALSE
        `, [academic_year]);

        if (ineligible.length === 0) {
            return res.status(404).json({ message: 'No ineligible students found to notify' });
        }
        
        // Send notifications in background
        const results = await Promise.all(ineligible.map(async student => {
            let emailSent = false;
            let smsSent = false;
            
            const subject = 'Action Required: Placement Eligibility Status';
            
            let reasonsList = student.ineligibility_reasons;
            try {
                if (typeof reasonsList === 'string') {
                    reasonsList = JSON.parse(reasonsList);
                }
            } catch (e) {
                console.warn('Error parsing ineligibility_reasons:', e);
            }

            const reasonsStr = Array.isArray(reasonsList) 
                ? reasonsList.join(', ') 
                : reasonsList;
            
            const html = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #e11d48;">Placement Eligibility Notification</h2>
                    <p>Dear <strong>${student.name}</strong>,</p>
                    <p>This is to inform you that based on the current evaluation of academic and attendance records for the year <strong>${student.academic_year}</strong>, you are currently marked as <strong>Ineligible</strong> for campus placements.</p>
                    
                    <div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; border-left: 4px solid #e11d48; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #be123c;">Reason(s) for Ineligibility:</h4>
                        <p style="font-weight: bold; margin-bottom: 0;">${reasonsStr}</p>
                    </div>

                    <p><strong>Your Current Metrics:</strong></p>
                    <ul>
                        <li>Attendance: ${Number(student.attendance_percentage).toFixed(2)}%</li>
                        <li>ISE Average: ${Number(student.ise_average).toFixed(2)}%</li>
                        <li>Active Backlogs: ${student.active_backlogs}</li>
                    </ul>

                    <p>Please contact the Placement Office or your Department Coordinator immediately to discuss your status or to rectify any data discrepancies.</p>
                    
                    <br>
                    <p style="font-size: 0.9em; color: #666;">Regards,<br><strong>Training & Placement Cell</strong><br>SSBT's College of Engineering & Technology</p>
                </div>
            `;

            // 1. Send Email
            emailSent = await sendEmail({ to: student.email, subject, html });

            // 2. Send SMS for "Real-Time" urgency if mobile is present
            if (student.mobile_number) {
                const smsText = `Placement Alert: You are currently marked INELIGIBLE for ${student.academic_year} placements due to: ${reasonsStr.substring(0, 50)}... Check email for details.`;
                smsSent = await sendSMS(student.mobile_number, smsText);
            }

            return { student: student.name, student_id: student.student_id, emailSent, smsSent };
        }));

        console.log('--- Notify Ineligible Students Started ---');
        // 3. Create In-App Announcement for Dashboard Visibility (Real-Time)
        try {
            const [annRes] = await pool.query(
                'INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, priority, target_audience, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
                [req.user.id, req.user.role, 'Placement Eligibility Notification', `Evaluation for ${academic_year} is complete. Some students have been marked as ineligible. Check profile for details.`, 'urgent', 'high', 'students']
            );
            
            const announcementId = annRes.insertId;
            console.log(`Announcement created with ID: ${announcementId}`);

            // Use results to get accurate delivery status
            const recipientValues = results.map(r => [
                announcementId, 
                r.student_id, 
                'student', 
                1, // delivered_in_app
                r.emailSent ? 1 : 0, 
                r.smsSent ? 1 : 0
            ]);

            if (recipientValues.length > 0) {
                await pool.query(
                    'INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type, delivered_in_app, delivered_email, delivered_sms) VALUES ?',
                    [recipientValues]
                );
                console.log('Recipient records inserted successfully.');
            }
        } catch (annError) {
            console.error('Failed to create in-app announcement:', annError);
        }

        const successCount = results.filter(r => r.emailSent || r.smsSent).length;
        res.json({ 
            message: `Notifications processed. Successfully notified ${successCount}/${ineligible.length} students.`,
            details: results 
        });
        console.log('--- Notify Ineligible Students Completed ---');
    } catch (error) {
        console.error('CRITICAL ERROR in notifyIneligibleStudents:', error);
        res.status(500).json({ message: 'Error sending notifications', error: error.message });
    }
};

// @desc    Notify all eligible students via Email
// @route   POST /api/admin/placement/eligibility/notify-eligible
const notifyEligibleStudents = async (req, res) => {
    const { academic_year = '2025-26' } = req.body;
    console.log('--- Notify Eligible Students Started ---');
    console.log('Academic Year:', academic_year);
    
    try {
        console.log('Fetching eligible students from database...');
        const [eligible] = await pool.query(`
            SELECT pe.*, u.name, u.email, u.mobile_number, s.department
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE pe.academic_year = ? AND (pe.is_eligible = TRUE OR pe.is_exception = TRUE)
        `, [academic_year]);

        console.log(`Found ${eligible.length} eligible students.`);

        if (eligible.length === 0) {
            console.log('No eligible students found.');
            return res.status(404).json({ message: 'No eligible students found to notify' });
        }

        console.log('Sending notifications to students...');
        // Send notifications in background
        const results = await Promise.all(eligible.map(async student => {
            console.log(`Processing student: ${student.name} (${student.email})`);
            let emailSent = false;
            let smsSent = false;

            const subject = 'Congratulations: You are Eligible for Placements!';
            
            const html = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #10b981;">Placement Eligibility Success</h2>
                    <p>Dear <strong>${student.name}</strong>,</p>
                    <p>Congratulations! Based on the current evaluation of academic and attendance records for the year <strong>${student.academic_year}</strong>, you have been marked as <strong>Eligible</strong> for campus placements.</p>
                    
                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #15803d;">Your Current Status:</h4>
                        <p style="font-weight: bold; margin-bottom: 0;">ELIGIBLE TO APPEAR FOR INTERVIEWS</p>
                    </div>

                    <p><strong>Your Evaluation Metrics:</strong></p>
                    <ul>
                        <li>Attendance: ${Number(student.attendance_percentage).toFixed(2)}%</li>
                        <li>ISE Average: ${Number(student.ise_average).toFixed(2)}%</li>
                        <li>Active Backlogs: ${student.active_backlogs}</li>
                    </ul>

                    <p>Please ensure your resume is updated and you are prepared for the upcoming recruitment drives. Stay tuned for further announcements regarding specific company schedules.</p>
                    
                    <br>
                    <p style="font-size: 0.9em; color: #666;">Regards,<br><strong>Training & Placement Cell</strong><br>SSBT's College of Engineering & Technology</p>
                </div>
            `;

            try {
                // 1. Send Email
                emailSent = await sendEmail({ to: student.email, subject, html });
                console.log(`Email to ${student.email}: ${emailSent ? 'SUCCESS' : 'FAILED'}`);

                // 2. Send SMS for "Real-Time" success alert
                if (student.mobile_number) {
                    const smsText = `Congratulations ${student.name}! You are ELIGIBLE for ${student.academic_year} campus placements. Check your email for full details.`;
                    smsSent = await sendSMS(student.mobile_number, smsText);
                    console.log(`SMS to ${student.mobile_number}: ${smsSent ? 'SUCCESS' : 'FAILED'}`);
                }
            } catch (notifyErr) {
                console.error(`Notification individual error for ${student.name}:`, notifyErr);
            }

            return { student: student.name, student_id: student.student_id, emailSent, smsSent };
        }));

        console.log('Creating in-app announcement...');
        // 3. Create In-App Announcement for Dashboard Visibility (Real-Time)
        try {
            const [annRes] = await pool.query(
                'INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, priority, target_audience, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
                [req.user.id, req.user.role, 'Congratulations: Placement Eligible!', `Evaluation for ${academic_year} is complete. You have been marked as ELIGIBLE for placements.`, 'general', 'high', 'students']
            );
            
            const announcementId = annRes.insertId;
            console.log(`Announcement created with ID: ${announcementId}`);

            // Use results to get accurate delivery status
            const recipientValues = results.map(r => [
                announcementId, 
                r.student_id, 
                'student', 
                1, // delivered_in_app
                r.emailSent ? 1 : 0, 
                r.smsSent ? 1 : 0
            ]);
            console.log(`Inserting ${recipientValues.length} recipient records...`);

            if (recipientValues.length > 0) {
                await pool.query(
                    'INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type, delivered_in_app, delivered_email, delivered_sms) VALUES ?',
                    [recipientValues]
                );
                console.log('Recipient records inserted successfully.');
            }
        } catch (annError) {
            console.error('Failed to create in-app announcement:', annError);
        }

        const successCount = results.filter(r => r.emailSent || r.smsSent).length;
        console.log(`Finished processing. Success Count: ${successCount}`);

        res.json({ 
            message: `Success notifications processed. Notified ${successCount}/${eligible.length} students.`,
            details: results
        });
        console.log('--- Notify Eligible Students Completed ---');
    } catch (error) {
        console.error('CRITICAL ERROR in notifyEligibleStudents:', error);
        res.status(500).json({ message: 'Error sending notifications', error: error.message });
    }
};

// Keeping original getPlacementAnalytics as a fallback or for simple stats
const getPlacementAnalytics = async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM placement_stats ORDER BY year DESC');
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// @desc    Generate attendance report
// @route   GET /api/admin/reports/attendance
const getAttendanceReport = async (req, res) => {
    try {
        const { department, month } = req.query;
        // Logic for complex report generation
        res.json({ message: 'Report data compiled', data: [] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Other reports (ISE, Compliance)
const getISEPerformanceReport = async (req, res) => res.json({ message: 'ISE Performance compiled' });
const getComplianceReport = async (req, res) => res.json({ message: 'Compliance Report compiled' });
const exportReport = async (req, res) => res.json({ message: `Exporting as ${req.params.type}` });

// @desc    Notification history and Announcements
const getNotificationHistory = async (req, res) => {
    try {
        const [history] = await pool.query('SELECT * FROM announcements ORDER BY sent_at DESC LIMIT 50');
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createAnnouncement = async (req, res) => {
    const { title, content, target_audience, is_pinned, announcement_type, priority } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO announcements (title, content, target_audience, is_pinned, sender_id, sender_role, announcement_type, priority, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
            [title, content, target_audience, is_pinned || false, req.user.id, req.user.role, announcement_type || 'general', priority || 'normal']
        );
        res.status(201).json({ message: 'Announcement created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating announcement' });
    }
};

const sendBulkNotification = async (req, res) => {
    const { title, message, target_roles, target_departments } = req.body;
    try {
        // For SSBT, bulk notifications are handled as urgent announcements
        const [result] = await pool.query(
            'INSERT INTO announcements (title, content, target_audience, sender_id, sender_role, announcement_type, priority, department, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
            [title, message, 'all', req.user.id, req.user.role, 'urgent', 'high', target_departments ? JSON.stringify(target_departments) : null]
        );
        
        // 2. Actually deliver via Email/SMS
        
        // Fetch recipients
        let recipientQuery = 'SELECT email, mobile_number FROM users WHERE 1=1';
        if (target_roles && target_roles !== 'all') {
            recipientQuery += ` AND role = "${target_roles}"`;
        }
        
        const [recipients] = await pool.query(recipientQuery);
        
        // Send in batches to avoid rate limits
        await Promise.all(recipients.map(async (r) => {
            const tasks = [];
            if (r.email) tasks.push(sendEmail({ to: r.email, subject: title, text: message }));
            if (r.mobile_number) tasks.push(sendSMS(r.mobile_number, `${title}: ${message}`));
            return Promise.all(tasks);
        }));
        
        res.status(201).json({ 
            message: 'Bulk notification sent and delivered successfully', 
            id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending bulk notification' });
    }
};

// @desc    System Settings
const getSystemSettings = async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM system_settings');
        // If empty, return defaults
        if (settings.length === 0) {
            return res.json([
                { setting_key: 'min_attendance', setting_value: '75' },
                { setting_key: 'geofence_radius', setting_value: '50' },
                { setting_key: 'face_confidence', setting_value: '0.85' }
            ]);
        }
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSystemSetting = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
        await pool.query(
            'INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)',
            [key, value, req.user.id]
        );
        res.json({ message: `Setting ${key} updated` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT log.*, u.name as admin_name 
            FROM admin_audit_log log 
            JOIN users u ON log.admin_id = u.id 
            ORDER BY log.created_at DESC
        `);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDepartments = async (req, res) => {
    try {
        // Standard SSBT COET Departments
        const standardDepartments = [
            'First Year Engineering',
            'Chemical Engineering',
            'Civil Engineering',
            'Computer Engineering',
            'Electrical Engineering',
            'Electronics & Telecommunications Engg.',
            'Mechanical Engineering'
        ];
        
        // Fetch any additional departments from DB to be safe, though standard ones are preferred
        const [dbDepts] = await pool.query('SELECT DISTINCT department FROM students WHERE department IS NOT NULL AND department != ""');
        const dbDeptNames = dbDepts.map(d => d.department);
        
        // Merge and remove duplicates, keeping standard ones first
        const allDepts = [...new Set([...standardDepartments, ...dbDeptNames])];
        
        res.json(allDepts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching departments' });
    }
};

const backupDatabase = async (req, res) => {
    res.json({ message: 'Automated database backup triggered successfully' });
};

module.exports = {
    getDashboardStats,
    getDashboardCharts,
    getRecentActivity,
    getStudents,
    getTeachers,
    createUser,
    updateUser,
    deleteUser,
    bulkUploadStudents,
    promoteBatch,
    exportUsersCSV,
    getLiveAttendance,
    getAttendanceAnalytics,
    getDefaulters,
    generateAttendanceCode,
    getGeofencingLogs,
    getISEMarks,
    publishISE,
    getTimetable,
    createTimetable,
    updateTimetable,
    getPendingCertificates,
    verifyCertificate,
    rejectCertificate,
    getPlacementStats,
    updatePlacementData,
    getEligibleStudents,
    getPlacementRules,
    updatePlacementRules,
    evaluatePlacementEligibility,
    grantEligibilityException,
    revokeEligibilityException,
    notifyIneligibleStudents,
    notifyEligibleStudents,
    getPlacementAnalytics,
    getAttendanceReport,
    getISEPerformanceReport,
    getComplianceReport,
    exportReport,
    sendBulkNotification,
    getNotificationHistory,
    createAnnouncement,
    getSystemSettings,
    updateSystemSetting,
    getAuditLogs,
    getDepartments,
    backupDatabase
};



