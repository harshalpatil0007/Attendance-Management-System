const pool = require('../config/db');

// @desc    Get syllabus progress for a subject and division
// @route   GET /api/syllabus/:subjectId?division=A
// @access  Private (Teacher/Student)
const getSyllabusProgress = async (req, res) => {
    const { subjectId } = req.params;
    const { division } = req.query;
    const teacherId = req.user.role === 'teacher' ? req.user.id : null;

    try {
        // 1. Fetch units for the subject
        const [units] = await pool.query(
            'SELECT * FROM syllabus_units WHERE subject_id = ? ORDER BY unit_number ASC',
            [subjectId]
        );

        if (units.length === 0) {
            return res.json([]);
        }

        // 2. Fetch topics and their progress for each unit
        const results = [];
        for (const unit of units) {
            const [topics] = await pool.query(`
                SELECT 
                    t.*, 
                    p.status, 
                    p.completed_at, 
                    p.started_at,
                    p.notes,
                    p.id as progress_id
                FROM syllabus_topics t
                LEFT JOIN syllabus_progress p ON t.id = p.topic_id 
                    AND p.division = ? 
                WHERE t.unit_id = ?
                ORDER BY t.display_order ASC, t.id ASC
            `, [division || 'A', unit.id]);

            results.push({
                ...unit,
                topics: topics.map(t => ({
                    ...t,
                    status: t.status || 'not_started'
                }))
            });
        }

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update topic status
// @route   PUT /api/syllabus/topic/:id
const updateTopicStatus = async (req, res) => {
    const { id: topicId } = req.params;
    const { status, division, notes, date } = req.body;
    const userId = req.user.id;
    
    // Format date for MySQL (YYYY-MM-DD)
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    try {
        // 1. Check if progress entry exists
        const [existing] = await pool.query(
            'SELECT id, status FROM syllabus_progress WHERE topic_id = ? AND division = ?',
            [topicId, division]
        );

        let progressId;
        let prevStatus = 'not_started';

        if (existing.length > 0) {
            progressId = existing[0].id;
            prevStatus = existing[0].status;

            await pool.query(`
                UPDATE syllabus_progress 
                SET status = ?, 
                    started_at = CASE WHEN ? = 'teaching' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
                    completed_at = CASE WHEN ? = 'completed' THEN ? ELSE (CASE WHEN ? != 'completed' THEN NULL ELSE completed_at END) END,
                    notes = ?,
                    last_updated_by = ?
                WHERE id = ?
            `, [
                status, 
                status, 
                status, formattedDate, status,
                notes, 
                userId, 
                progressId
            ]);
        } else {
            const [result] = await pool.query(`
                INSERT INTO syllabus_progress 
                (topic_id, teacher_id, division, status, started_at, completed_at, notes, last_updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                topicId, userId, division, status,
                status === 'teaching' ? new Date() : null,
                status === 'completed' ? formattedDate : null,
                notes, userId
            ]);
            progressId = result.insertId;
        }

        // 2. Log History
        if (prevStatus !== status) {
            await pool.query(`
                INSERT INTO syllabus_progress_history 
                (progress_id, previous_status, new_status, changed_by)
                VALUES (?, ?, ?, ?)
            `, [progressId, prevStatus, status, userId]);
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add extra topic
// @route   POST /api/syllabus/extra
const addExtraTopic = async (req, res) => {
    const { unitId, topicName, topicType, importance, lectureCount, division, status, visibleToStudents } = req.body;
    const userId = req.user.id;

    try {
        // 0. Check if topic already exists in this unit
        const [existing] = await pool.query(
            'SELECT id FROM syllabus_topics WHERE unit_id = ? AND topic_name = ?',
            [unitId, topicName]
        );

        let topicId;
        if (existing.length > 0) {
            topicId = existing[0].id;
            // Update it to be an extra topic if it wasn't
            await pool.query('UPDATE syllabus_topics SET is_extra = TRUE WHERE id = ?', [topicId]);
        } else {
            // 1. Insert into syllabus_topics
            const [topicResult] = await pool.query(`
                INSERT INTO syllabus_topics 
                (unit_id, topic_name, is_extra, topic_type, importance, lecture_count, visible_to_students, added_by)
                VALUES (?, ?, TRUE, ?, ?, ?, ?, ?)
            `, [unitId, topicName, topicType || 'additional_concept', importance || 'recommended', lectureCount || 1, visibleToStudents !== false, userId]);
            topicId = topicResult.insertId;
        }

        // 2. Insert into syllabus_progress if status is provided
        if (status) {
            await pool.query(`
                INSERT INTO syllabus_progress 
                (topic_id, teacher_id, division, status, started_at, completed_at, last_updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                topicId, userId, division || 'A', status,
                status === 'teaching' ? new Date() : null,
                status === 'completed' ? new Date().toISOString().split('T')[0] : null,
                userId
            ]);
        }

        res.status(201).json({ message: 'Extra topic added', id: topicId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteExtraTopic = async (req, res) => {
    const { id } = req.params;
    try {
        // Ensure it's extra topic before deleting
        const [topic] = await pool.query('SELECT is_extra FROM syllabus_topics WHERE id = ?', [id]);
        if (!topic[0]?.is_extra) {
            return res.status(403).json({ message: 'Cannot delete core topics' });
        }
        await pool.query('DELETE FROM syllabus_topics WHERE id = ?', [id]);
        res.json({ message: 'Topic deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const bulkAction = async (req, res) => {
    const { unitId, division, action } = req.body;
    const userId = req.user.id;

    try {
        const [topics] = await pool.query('SELECT id FROM syllabus_topics WHERE unit_id = ?', [unitId]);
        
        for (const topic of topics) {
            let status = 'not_started';
            if (action === 'complete') status = 'completed';
            if (action === 'teaching') status = 'teaching';

            await pool.query(`
                INSERT INTO syllabus_progress 
                (topic_id, teacher_id, division, status, completed_at, last_updated_by)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                completed_at = VALUES(completed_at),
                last_updated_by = VALUES(last_updated_by)
            `, [topic.id, userId, division, status, status === 'completed' ? new Date().toISOString().split('T')[0] : null, userId]);
        }

        res.json({ message: 'Bulk action completed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSyllabusProgress,
    updateTopicStatus,
    addExtraTopic,
    deleteExtraTopic,
    bulkAction
};
