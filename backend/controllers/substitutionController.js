const pool = require('../config/db');

// @desc    Get substitution requests for the teacher
// @route   GET /api/teacher/substitution/requests
const getSubstitutionRequests = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const [rows] = await pool.query(`
            SELECT sr.*, u.name as original_teacher_name, 
                   t.day_of_week, t.start_time, t.end_time, s.subject_name
            FROM substitution_requests sr
            JOIN users u ON sr.original_teacher_id = u.id
            JOIN timetables t ON sr.timetable_entry_id = t.id
            JOIN subjects s ON t.subject_id = s.id
            WHERE sr.substitute_teacher_id = ? OR sr.original_teacher_id = ?
            ORDER BY sr.request_date DESC
        `, [teacherId, teacherId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get teachers available for substitution at a specific time
// @route   GET /api/teacher/substitution/available-teachers
const getAvailableTeachers = async (req, res) => {
    try {
        const { day, start_time, end_time } = req.query;
        
        const [rows] = await pool.query(`
            SELECT u.id, u.name, ta.availability_type, ta.notes
            FROM users u
            JOIN teacher_availability ta ON u.id = ta.teacher_id
            WHERE ta.day_of_week = ? AND ta.is_available = TRUE
            AND ta.start_time <= ? AND ta.end_time >= ?
        `, [day, start_time, end_time]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a substitution request
// @route   POST /api/teacher/substitution/request
const createSubstitutionRequest = async (req, res) => {
    try {
        const { substitute_teacher_id, timetable_entry_id, request_date, reason } = req.body;
        const original_teacher_id = req.user.id;

        await pool.query(`
            INSERT INTO substitution_requests 
            (original_teacher_id, substitute_teacher_id, timetable_entry_id, request_date, reason, requested_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [original_teacher_id, substitute_teacher_id, timetable_entry_id, request_date, reason, original_teacher_id]);

        res.json({ message: 'Substitution request created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Accept/Reject substitution request
// @route   PUT /api/teacher/substitution/request/:id/:action
const handleSubstitutionRequest = async (req, res) => {
    try {
        const { id, action } = req.params;
        const status = action === 'accept' ? 'accepted' : 'rejected';
        
        await pool.query(`
            UPDATE substitution_requests 
            SET status = ?, approved_at = IF(? = 'accepted', CURRENT_TIMESTAMP, approved_at)
            WHERE id = ?
        `, [status, status, id]);

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSubstitutionRequests,
    getAvailableTeachers,
    createSubstitutionRequest,
    handleSubstitutionRequest
};
