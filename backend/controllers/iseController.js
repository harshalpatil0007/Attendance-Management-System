const pool = require('../config/db');

// @desc    Get students and their marks for a class/subject/ISE
// @route   GET /api/ise/students/:subjectId/:division/:iseNumber
// @access  Private (Teacher)
const getStudentsForISE = async (req, res) => {
    const { subjectId, year, division, iseNumber } = req.params;
    console.log(`Fetching students for: Subject=${subjectId}, Year=${year}, Div=${division}, ISE=${iseNumber}`);
    try {
        // Fetch department from assignment
        const [assignment] = await pool.query(
            'SELECT department FROM teacher_assignments WHERE subject_id = ? AND division = ? AND year = ?',
            [subjectId, division, year]
        );
        
        const dept = assignment.length > 0 ? assignment[0].department : null;
        if (!dept) {
            console.log("No assignment found for this combination.");
            return res.json([]); // Return empty list instead of 404
        }

        const [students] = await pool.query(`
            SELECT u.id, u.name, s_data.prn_number, s_data.roll_no_in_class,
                   m.marks_obtained, m.status, m.remarks,
                   (SELECT (SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/COUNT(*))*100 
                    FROM attendance WHERE student_id = u.id AND subject_id = ?) as attendance_rate
            FROM users u
            JOIN students s_data ON u.id = s_data.user_id
            LEFT JOIN ise_marks_new m ON u.id = m.student_id AND m.subject_id = ? AND m.ise_number = ?
            WHERE s_data.department = ? AND s_data.current_year = ? AND s_data.division = ? AND u.role = 'student'
            ORDER BY s_data.roll_no_in_class ASC
        `, [subjectId, subjectId, iseNumber, dept, year, division]);
        console.log(`Found ${students.length} students.`);

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save/Update ISE marks
// @route   POST /api/ise/marks
// @access  Private (Teacher)
const saveISEMarks = async (req, res) => {
    const { subjectId, iseNumber, marksData } = req.body;
    // marksData: [{ studentId, marks, remarks, status }]
    
    try {
        const queries = marksData.map(item => {
            return pool.query(`
                INSERT INTO ise_marks_new (student_id, subject_id, ise_number, marks_obtained, entered_by, remarks, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    marks_obtained = VALUES(marks_obtained),
                    remarks = VALUES(remarks),
                    status = VALUES(status),
                    updated_at = CURRENT_TIMESTAMP
            `, [item.studentId, subjectId, iseNumber, item.marks, req.user.id, item.remarks, item.status || 'draft']);
        });

        await Promise.all(queries);
        res.json({ message: 'Marks saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Publish marks for an ISE
// @route   PUT /api/ise/publish
// @access  Private (Teacher)
const publishISEMarks = async (req, res) => {
    const { subjectId, year, iseNumber, division } = req.body;
    try {
        await pool.query(`
            UPDATE ise_marks_new m
            JOIN users u ON m.student_id = u.id
            JOIN students s ON u.id = s.user_id
            SET m.status = 'published'
            WHERE m.subject_id = ? AND m.ise_number = ? AND s.division = ? AND s.current_year = ? AND m.status = 'draft'
        `, [subjectId, iseNumber, division, year]);

        res.json({ message: 'Marks published successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get ISE Analysis for a subject
// @route   GET /api/ise/analysis/:subjectId
// @access  Private (Teacher)
const getISEAnalysis = async (req, res) => {
    const { subjectId } = req.params;
    try {
        const [stats] = await pool.query(`
            SELECT ise_number, 
                   AVG(marks_obtained) as average,
                   MAX(marks_obtained) as highest,
                   MIN(marks_obtained) as lowest,
                   COUNT(CASE WHEN marks_obtained >= 8 THEN 1 END) as pass_count,
                   COUNT(*) as total_count
            FROM ise_marks_new
            WHERE subject_id = ? AND status = 'published'
            GROUP BY ise_number
        `, [subjectId]);

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStudentsForISE,
    saveISEMarks,
    publishISEMarks,
    getISEAnalysis
};
