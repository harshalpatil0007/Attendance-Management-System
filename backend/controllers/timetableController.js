const pool = require('../config/db');

// @desc    Get timetable based on dept, year, div
// @route   GET /api/timetable/:department/:year/:division
// @access  Private
const getTimetable = async (req, res) => {
    const { department, year, division } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.subject_name, s.subject_code, u.name as teacher_name
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users u ON t.teacher_id = u.id
            WHERE t.department = ? AND t.year_level = ? AND t.division = ?
            ORDER BY t.start_time ASC
        `, [department, year, division]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get today's schedule for a student
// @route   GET /api/timetable/today/:prn
// @access  Private
const getTodaySchedule = async (req, res) => {
    try {
        const identifier = req.params.prn || req.params.identifier;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        if (today === 'Sunday') return res.json([]);

        // Fetch student section info - Robust version
        const [studentRows] = await pool.query(`
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
            WHERE s.prn_number = ? OR u.id = ?`, [identifier, identifier]);

        if (studentRows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
        const student = studentRows[0];

        const dept = student.department;
        const year = student.year;
        const div = student.division;
        const current_semester = student.current_semester;

        let query = `
            SELECT t.*, s.subject_name, s.subject_code, u.name as teacher_name
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users u ON t.teacher_id = u.id
            WHERE 
                TRIM(UPPER(t.department)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.year_level)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.division)) = TRIM(UPPER(?)) AND
                t.day_of_week = ?
        `;
        let params = [dept, year, div, today];

        if (current_semester) {
            query += ' AND s.semester = ?';
            params.push(current_semester);
        }

        query += ' ORDER BY t.start_time ASC';

        const [rows] = await pool.query(query, params);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching today schedule' });
    }
};

// @desc    Get weekly schedule for a student
// @route   GET /api/timetable/student/weekly/:identifier
// @access  Private
const getStudentWeeklySchedule = async (req, res) => {
    try {
        const identifier = req.params.identifier;

        // Fetch student section info
        const [studentRows] = await pool.query(`
            SELECT 
                u.id as user_id, u.name,
                CASE 
                    WHEN s.department IN ('CSE', 'Computer Science', 'Computer Engineering', 'IT') THEN 'Computer Engineering'
                    ELSE s.department 
                END as department,
                COALESCE(NULLIF(s.current_year, ''), s.year_semester) as year, 
                s.division,
                s.current_semester,
                s.roll_number
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE s.prn_number = ? OR u.id = ?`, [identifier, identifier]);

        if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });
        const student = studentRows[0];

        const dept = student.department;
        const year = student.year;
        const div = student.division;
        const sem = student.current_semester;
        const rollNo = parseInt(student.roll_number) || 0;

        // Determine Batch
        let assignedBatch = null;
        if (rollNo > 0) {
            const [batchRows] = await pool.query(`
                SELECT batch_name FROM batch_configuration 
                WHERE department = ? AND year = ? AND division = ? AND semester = ?
                AND roll_from <= ? AND roll_to >= ?`, [dept, year, div, sem, rollNo, rollNo]);
            if (batchRows.length > 0) assignedBatch = batchRows[0].batch_name;
        }

        // Fetch Timetable Entries (Common + Student's Batch)
        const [rows] = await pool.query(`
            SELECT t.id, t.department, t.year_level, t.division, t.day_of_week, 
                   CAST(t.start_time AS CHAR) as start_time, 
                   CAST(t.end_time AS CHAR) as end_time, 
                   t.subject_id, t.teacher_id, t.room_number, t.type, t.batch,
                   s.subject_name, s.subject_code, s.subject_type,
                   u.name as teacher_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users u ON t.teacher_id = u.id
            WHERE 
                TRIM(UPPER(t.department)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.year_level)) = TRIM(UPPER(?)) AND 
                TRIM(UPPER(t.division)) = TRIM(UPPER(?)) AND
                (t.batch IS NULL OR t.batch = ?)
            ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time ASC
        `, [dept, year, div, assignedBatch]);

        // Aggregate unique subjects and faculty for the dashboard tables
        const subjectDetails = [];
        const seenSubjects = new Set();

        rows.forEach(row => {
            if (row.subject_id && !seenSubjects.has(row.subject_id)) {
                seenSubjects.add(row.subject_id);
                subjectDetails.push({
                    id: row.subject_id,
                    name: row.subject_name,
                    code: row.subject_code,
                    type: row.subject_type || (row.type === 'Lab' ? 'PR' : 'TH'),
                    faculty: row.teacher_name
                });
            }
        });

        res.json({
            profile: {
                ...student,
                assigned_batch: assignedBatch
            },
            timetable: rows,
            subject_details: subjectDetails,
            batch_info: assignedBatch ? {
                name: assignedBatch,
                roll_number: rollNo
            } : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching weekly schedule' });
    }
};

// @desc    Get teacher's weekly schedule
// @route   GET /api/teacher/timetable
// @access  Private (Teacher)
const getTeacherWeeklySchedule = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [rows] = await pool.query(`
            SELECT t.*, s.subject_name, s.subject_code, s.subject_type,
                   tt.role, u.name as teacher_name
            FROM timetables t
            JOIN teacher_timetable tt ON t.id = tt.timetable_entry_id
            JOIN subjects s ON t.subject_id = s.id
            JOIN users u ON tt.teacher_id = u.id
            WHERE tt.teacher_id = ? AND tt.is_active = TRUE
            ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time ASC
        `, [teacherId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching teacher weekly schedule' });
    }
};

// @desc    Get teacher's today schedule
// @route   GET /api/teacher/timetable/today
// @access  Private (Teacher)
const getTeacherTodaySchedule = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        if (today === 'Sunday') return res.json([]);
            
        const [rows] = await pool.query(`
            SELECT t.*, s.subject_name, s.subject_code, s.subject_type,
                   tt.role, bc.roll_from, bc.roll_to,
                   (SELECT COUNT(*) FROM attendance_sessions as1 WHERE as1.timetable_id = t.id AND as1.date = CURDATE() AND as1.is_active = TRUE) as is_live
            FROM timetables t
            JOIN teacher_timetable tt ON t.id = tt.timetable_entry_id
            JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN batch_configuration bc ON t.batch = bc.batch_name AND t.department = bc.department AND t.year_level = bc.year AND t.division = bc.division
            WHERE tt.teacher_id = ? AND t.day_of_week = ? AND tt.is_active = TRUE
            ORDER BY t.start_time ASC
        `, [teacherId, today]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching teacher daily schedule' });
    }
};

// @desc    Get teacher workload analytics
// @route   GET /api/teacher/timetable/workload
// @access  Private (Teacher)
const getTeacherWorkload = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // 1. Get weekly hours distribution
        const [hoursRows] = await pool.query(`
            SELECT t.day_of_week, SUM(TIMESTAMPDIFF(HOUR, t.start_time, t.end_time)) as hours
            FROM timetables t
            JOIN teacher_timetable tt ON t.id = tt.timetable_entry_id
            WHERE tt.teacher_id = ? AND tt.is_active = TRUE
            GROUP BY t.day_of_week
        `, [teacherId]);

        // 2. Get subjects and student counts
        const [subjectRows] = await pool.query(`
            SELECT DISTINCT s.subject_name, t.type, t.batch, t.department, t.year_level, t.division,
                   CASE 
                       WHEN t.type = 'Lab' THEN (SELECT roll_to - roll_from + 1 FROM batch_configuration bc WHERE bc.department = t.department AND bc.year = t.year_level AND bc.division = t.division AND bc.batch_name = t.batch LIMIT 1)
                       ELSE (SELECT COUNT(*) FROM students st WHERE st.department = t.department AND st.current_year = t.year_level AND st.division = t.division)
                   END as student_count
            FROM timetables t
            JOIN teacher_timetable tt ON t.id = tt.timetable_entry_id
            JOIN subjects s ON t.subject_id = s.id
            WHERE tt.teacher_id = ? AND tt.is_active = TRUE
        `, [teacherId]);

        res.json({
            hours_distribution: hoursRows,
            subjects: subjectRows,
            total_hours: hoursRows.reduce((acc, curr) => acc + parseFloat(curr.hours), 0),
            dept_avg: 9 // Mocked department average for comparison
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching teacher workload' });
    }
};

module.exports = {
    getTimetable,
    getTodaySchedule,
    getStudentWeeklySchedule,
    getTeacherWeeklySchedule,
    getTeacherTodaySchedule,
    getTeacherWorkload
};

