const pool = require('../config/db');

// @desc    Get teacher expertise (subjects, labs, skills)
// @route   GET /api/teacher/expertise
// @access  Private (Teacher)
const getTeacherExpertise = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [subjects] = await pool.query(`
            SELECT te.*, s.subject_name, s.subject_code, s.department, s.semester
            FROM teacher_expertise te
            JOIN subjects s ON te.subject_id = s.id
            WHERE te.teacher_id = ?
        `, [teacherId]);

        const [labs] = await pool.query(`
            SELECT tle.*, l.lab_name, l.lab_code, l.department
            FROM teacher_lab_expertise tle
            JOIN labs l ON tle.lab_id = l.id
            WHERE tle.teacher_id = ?
        `, [teacherId]);

        const [skills] = await pool.query(`
            SELECT * FROM teacher_programming_skills
            WHERE teacher_id = ?
        `, [teacherId]);

        res.json({ subjects, labs, skills });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get master data for expertise selection
// @route   GET /api/teacher/expertise/master-data
// @access  Private (Teacher)
const getMasterData = async (req, res) => {
    try {
        const [subjects] = await pool.query('SELECT * FROM subjects WHERE is_active = TRUE ORDER BY semester ASC');
        const [labs] = await pool.query('SELECT * FROM labs WHERE is_active = TRUE');
        res.json({ subjects, labs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save/Update subject expertise
// @route   POST /api/teacher/expertise/subjects
// @access  Private (Teacher)
const updateSubjectExpertise = async (req, res) => {
    const { selections } = req.body; // Array of { subject_id, proficiency_level, years_of_experience }
    const teacherId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Delete existing expertise first for clean sync
        await connection.query('DELETE FROM teacher_expertise WHERE teacher_id = ?', [teacherId]);

        if (selections && selections.length > 0) {
            const values = selections.map(s => [teacherId, s.subject_id, s.proficiency_level, s.years_of_experience || 0]);
            await connection.query(
                'INSERT INTO teacher_expertise (teacher_id, subject_id, proficiency_level, years_of_experience) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Subject expertise updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Save/Update lab expertise
// @route   POST /api/teacher/expertise/labs
// @access  Private (Teacher)
const updateLabExpertise = async (req, res) => {
    const { selections } = req.body; // Array of { lab_id, proficiency_level }
    const teacherId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM teacher_lab_expertise WHERE teacher_id = ?', [teacherId]);

        if (selections && selections.length > 0) {
            const values = selections.map(l => [teacherId, l.lab_id, l.proficiency_level]);
            await connection.query(
                'INSERT INTO teacher_lab_expertise (teacher_id, lab_id, proficiency_level) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Lab expertise updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Save/Update programming skills
// @route   POST /api/teacher/expertise/skills
// @access  Private (Teacher)
const updateProgrammingSkills = async (req, res) => {
    const { skills } = req.body; // Array of { language_name, proficiency_level }
    const teacherId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM teacher_programming_skills WHERE teacher_id = ?', [teacherId]);

        if (skills && skills.length > 0) {
            const values = skills.map(s => [teacherId, s.language_name, s.proficiency_level]);
            await connection.query(
                'INSERT INTO teacher_programming_skills (teacher_id, language_name, proficiency_level) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Programming skills updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// --- Master Data Management ---

// @desc    Add new subject to master list
// @route   POST /api/teacher/expertise/master/subjects
const addMasterSubject = async (req, res) => {
    const { subject_name, subject_code, department, semester, subject_type } = req.body;
    try {
        await pool.query(
            'INSERT INTO subjects (subject_name, subject_code, department, semester, subject_type) VALUES (?, ?, ?, ?, ?)',
            [subject_name, subject_code, department, semester, subject_type || 'Theory']
        );
        res.status(201).json({ message: 'Subject added to master list' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Subject code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Soft-delete subject from master list
// @route   DELETE /api/teacher/expertise/master/subjects/:id
const deleteMasterSubject = async (req, res) => {
    try {
        await pool.query('UPDATE subjects SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Subject removed from master list' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add new lab to master list
// @route   POST /api/teacher/expertise/master/labs
const addMasterLab = async (req, res) => {
    const { lab_name, lab_code, department } = req.body;
    try {
        await pool.query(
            'INSERT INTO labs (lab_name, lab_code, department) VALUES (?, ?, ?)',
            [lab_name, lab_code, department]
        );
        res.status(201).json({ message: 'Lab added to master list' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Lab code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Soft-delete lab from master list
// @route   DELETE /api/teacher/expertise/master/labs/:id
const deleteMasterLab = async (req, res) => {
    try {
        await pool.query('UPDATE labs SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Lab removed from master list' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTeacherExpertise,
    getMasterData,
    updateSubjectExpertise,
    updateLabExpertise,
    updateProgrammingSkills,
    addMasterSubject,
    deleteMasterSubject,
    addMasterLab,
    deleteMasterLab
};
