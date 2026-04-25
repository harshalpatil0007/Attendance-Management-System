const pool = require('../config/db');

const syncATCoins = async (userId) => {
    try {
        // 1. Get attendance stats straight from the records (matches dashboard visual)
        // This avoids mismatches with session metadata (dept/div/year)
        const [stats] = await pool.query(`
            SELECT 
                subject_id, 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended_count
            FROM attendance 
            WHERE student_id = ?
            GROUP BY subject_id`, [userId]);

        // 2. Get already rewarded subjects
        const [existingRewards] = await pool.query('SELECT subject_id FROM subject_coin_rewards WHERE user_id = ?', [userId]);
        const rewardedSubjectIds = existingRewards.map(r => r.subject_id);
        
        for (const stat of stats) {
            const subjectId = stat.subject_id;
            if (stat.total_sessions === 0) continue;
            
            const percentage = (stat.attended_count / stat.total_sessions) * 100;
            
            // If they maintain >= 75% and haven't been rewarded yet
            if (percentage >= 75 && !rewardedSubjectIds.includes(subjectId)) {
                await pool.query('INSERT IGNORE INTO subject_coin_rewards (user_id, subject_id) VALUES (?, ?)', [userId, subjectId]);
                console.log(`[REWARDS] Granted milestone reward for Subject ${subjectId} to User ${userId}`);
            }
        }
        
        // 3. Absolute Balance Sync: Total coins = rewards_count * 15
        // This fixes any desync from seeding or partial updates
        const [totalRewards] = await pool.query('SELECT COUNT(*) as count FROM subject_coin_rewards WHERE user_id = ?', [userId]);
        const correctBalance = totalRewards[0].count * 15;
        
        await pool.query('UPDATE students SET at_coins = ? WHERE user_id = ?', [correctBalance, userId]);
        console.log(`[REWARDS] Synced total balance to ${correctBalance} for User ${userId}`);
        
    } catch (error) {
        console.error('Error syncing AT Coins:', error);
    }
};

// @desc    Get student profile
// @route   GET /api/student/profile/:prn
// @access  Private
const getProfile = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const userId = req.user.id;

        // Sync coins if user is viewing their own profile
        if (identifier === 'me' || identifier == userId) {
            await syncATCoins(userId);
        }

        // If identifier is NOT 'me' and not null/undefined/null-string
        let query = `
            SELECT u.*, s.* 
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            WHERE s.prn_number = ? OR u.id = ?`;
        let params = [identifier, identifier];

        if (identifier === 'me') {
            query = `
                SELECT u.*, s.* 
                FROM users u
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.id = ?`;
            params = [userId];
        }

        const [rows] = await pool.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send OTP for profile update
// @route   POST /api/student/send-otp
// @access  Private
const sendOTP = async (req, res) => {
    const { mobile_number } = req.body;
    const userId = req.user.id; // From protect middleware

    if (!mobile_number) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save OTP to database
        await pool.query(
            'INSERT INTO otp_verifications (user_id, identifier, otp, expires_at) VALUES (?, ?, ?, ?)',
            [userId, mobile_number, otp, expiresAt]
        );
        
        const { sendOTPNotification } = require('../utils/notificationService');
        const [user] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);

        // Send real OTP
        await sendOTPNotification(mobile_number, user[0]?.email, otp);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile/:prn
// @access  Private
const updateProfile = async (req, res) => {
    const { 
        name = '', email = '', prn_number = '', roll_number = '', dob = null, gender = '', blood_group = '',
        department = '', current_year = '', division = '', current_semester = null,
        local_address = '', permanent_address = '', mobile_number = '', 
        guardian_name = '', guardian_mobile = '', guardian_relation = '',
        emergency_contact_name = '', emergency_contact_mobile = '', 
        medical_conditions = '',
        otp = '' // OTP from frontend
    } = req.body;

    const identifier = req.params.identifier;
    const userId = req.user.id;

    // Format date for MySQL (YYYY-MM-DD)
    const formattedDob = dob ? new Date(dob).toISOString().split('T')[0] : null;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required to save changes' });
    }

    try {
        // Verify OTP
        const [otpRows] = await pool.query(
            'SELECT * FROM otp_verifications WHERE user_id = ? AND otp = ? AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
            [userId, otp]
        );

        if (otpRows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Mark OTP as verified
        await pool.query('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [otpRows[0].id]);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'UPDATE users SET name = ?, email = ?, mobile_number = ? WHERE id = ?',
                [name, email, mobile_number, userId]
            );

            await connection.query(
                `UPDATE students SET 
                    prn_number = ?, roll_number = ?, dob = ?, gender = ?, blood_group = ?,
                    department = ?, current_year = ?, division = ?, current_semester = ?,
                    local_address = ?, permanent_address = ?,
                    guardian_name = ?, guardian_mobile = ?, guardian_relation = ?,
                    emergency_contact_name = ?, emergency_contact_mobile = ?,
                    medical_conditions = ?
                 WHERE user_id = ?`,
                [
                    prn_number, roll_number, formattedDob, gender, blood_group,
                    department, current_year, division, current_semester,
                    local_address, permanent_address,
                    guardian_name, guardian_mobile, guardian_relation,
                    emergency_contact_name, emergency_contact_mobile,
                    medical_conditions,
                    userId
                ]
            );

            await connection.commit();
            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update student profile image
// @route   POST /api/student/profile-image/:prn
// @access  Private
const updateProfileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image' });
    }

    const imageUrl = `/uploads/profile_pics/${req.file.filename}`;

    try {
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE prn_number = ? OR id = ?',
            [imageUrl, req.params.identifier, req.params.identifier]
        );
        res.json({ message: 'Profile image updated successfully', imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get ISE marks
// @route   GET /api/student/marks/:prn
// @access  Private
const getMarks = async (req, res) => {
    try {
        const [studentRows] = await pool.query(`
            SELECT u.id, s.current_semester 
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            WHERE s.prn_number = ? OR u.id = ?`, [req.params.prn, req.params.prn]);
        if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });
        const student = studentRows[0];

        let query = `
            SELECT 
                s.id as subject_id,
                s.subject_name,
                s.subject_code,
                MAX(CASE WHEN m.ise_number = 'ISE-1' THEN m.marks_obtained ELSE 0 END) as ise_1,
                MAX(CASE WHEN m.ise_number = 'ISE-2' THEN m.marks_obtained ELSE 0 END) as ise_2,
                MAX(CASE WHEN m.ise_number = 'ISE-3' THEN m.marks_obtained ELSE 0 END) as ise_3
            FROM subjects s
            LEFT JOIN ise_marks_new m ON s.id = m.subject_id AND m.student_id = ? AND m.status = 'published'
        `;
        let params = [student.id];

        if (student.current_semester) {
            query += ' WHERE s.semester = ?';
            params.push(student.current_semester);
        }

        query += ' GROUP BY s.id, s.subject_name, s.subject_code';

        const [marks] = await pool.query(query, params);

        res.json(marks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get certificates
// @route   GET /api/certificates/:studentId
// @access  Private
const getCertificates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM certificates WHERE student_id = ?', [req.params.studentId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload certificate
// @route   POST /api/certificates/upload
// @access  Private
const uploadCertificate = async (req, res) => {
    const { student_id, title, category, issuing_org, issue_date } = req.body;
    const file_url = req.file ? `/uploads/certificates/${req.file.filename}` : null;

    const formattedIssueDate = issue_date ? new Date(issue_date).toISOString().split('T')[0] : null;

    try {
        const [result] = await pool.query(
            'INSERT INTO certificates (student_id, title, category, issuing_org, issue_date, file_url) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, title, category, issuing_org, formattedIssueDate, file_url]
        );
        res.status(201).json({ id: result.insertId, message: 'Certificate uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get syllabus progress
// @route   GET /api/student/syllabus/:subjectId
// @access  Private
// @desc    Get syllabus progress for student
// @route   GET /api/student/syllabus/:subjectId
// @access  Private
const getSyllabus = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { subjectId } = req.params;

        // 1. Get student's division and academic year
        const [student] = await pool.query('SELECT division, current_year, current_semester FROM students WHERE user_id = ?', [studentId]);
        if (student.length === 0) return res.status(404).json({ message: 'Student profile not found' });
        
        const division = student[0].division;
        const current_semester = student[0].current_semester;

        // 2. Fetch units and topics
        let query = `
            SELECT 
                u.id as unit_id, u.unit_number, u.unit_name,
                t.id as topic_id, t.topic_name, t.is_extra, t.topic_type, t.importance,
                p.status, p.completed_at, p.notes as teacher_notes,
                sn.personal_note, sn.marked_for_review,
                s.subject_name, s.subject_code, s.id as subject_id
            FROM syllabus_units u
            JOIN syllabus_topics t ON u.id = t.unit_id
            JOIN subjects s ON u.subject_id = s.id
            LEFT JOIN syllabus_progress p ON t.id = p.topic_id AND p.division = ?
            LEFT JOIN student_syllabus_notes sn ON t.id = sn.topic_id AND sn.student_id = ?
            WHERE t.visible_to_students = TRUE
        `;
        let params = [division, studentId];

        if (subjectId !== 'all') {
            query += ' AND s.id = ?';
            params.push(subjectId);
        } else if (current_semester) {
            query += ' AND s.semester = ?';
            params.push(current_semester);
        }

        query += ' ORDER BY s.id, u.unit_number, t.display_order, t.id';

        const [rows] = await pool.query(query, params);

        // Grouping logic
        const grouped = rows.reduce((acc, curr) => {
            if (!acc[curr.subject_id]) {
                acc[curr.subject_id] = {
                    id: curr.subject_id,
                    name: curr.subject_name,
                    code: curr.subject_code,
                    units: {}
                };
            }
            if (!acc[curr.subject_id].units[curr.unit_number]) {
                acc[curr.subject_id].units[curr.unit_number] = {
                    unit_id: curr.unit_id,
                    number: curr.unit_number,
                    name: curr.unit_name,
                    topics: []
                };
            }
            acc[curr.subject_id].units[curr.unit_number].topics.push({
                id: curr.topic_id,
                name: curr.topic_name,
                is_extra: curr.is_extra,
                type: curr.topic_type,
                importance: curr.importance,
                status: curr.status || 'not_started',
                completed_at: curr.completed_at,
                teacher_notes: curr.teacher_notes,
                personal_note: curr.personal_note,
                marked_for_review: curr.marked_for_review
            });
            return acc;
        }, {});

        // Convert grouped objects to arrays
        const result = Object.values(grouped).map(sub => ({
            ...sub,
            units: Object.values(sub.units)
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save personal syllabus note
// @route   POST /api/student/syllabus/note
const saveSyllabusNote = async (req, res) => {
    const { topicId, personalNote, markedForReview } = req.body;
    const studentId = req.user.id;

    try {
        await pool.query(`
            INSERT INTO student_syllabus_notes (student_id, topic_id, personal_note, marked_for_review)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            personal_note = VALUES(personal_note),
            marked_for_review = VALUES(marked_for_review)
        `, [studentId, topicId, personalNote, markedForReview]);

        res.json({ message: 'Note saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove student profile image
// @route   DELETE /api/student/profile-image/:identifier
// @access  Private
const deleteProfileImage = async (req, res) => {
    try {
        await pool.query(
            'UPDATE users SET profile_image = NULL WHERE prn_number = ? OR id = ?',
            [req.params.identifier, req.params.identifier]
        );
        res.json({ message: 'Profile image removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCertificate = async (req, res) => {
    try {
        await pool.query('DELETE FROM certificates WHERE id = ?', [req.params.id]);
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private
const getStudentNotifications = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Fetch announcements the student is a recipient of
        const [notifications] = await pool.query(
            `SELECT a.id, a.announcement_type as type, a.title as text, a.sent_at as time,
                    a.content, a.is_pinned, a.created_at,
                    u.name as sender_name,
                    'Bell' as icon, 'text-brand-500' as color, 'bg-brand-50' as bg, 'notifications' as tab
             FROM announcements a
             JOIN announcement_recipients ar ON a.id = ar.announcement_id
             JOIN users u ON a.sender_id = u.id
             WHERE ar.recipient_id = ? AND a.status = 'sent' AND ar.is_cleared = FALSE
             ORDER BY a.sent_at DESC LIMIT 15`,
            [studentId]
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error in getStudentNotifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

const clearStudentNotifications = async (req, res) => {
    try {
        const studentId = req.user.id;
        await pool.query(
            "UPDATE announcement_recipients SET is_cleared = TRUE WHERE recipient_id = ?",
            [studentId]
        );
        res.json({ message: 'Notifications cleared' });
    } catch (error) {
        console.error('Error clearing student notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateProfileImage,
    deleteProfileImage,
    getMarks,
    getCertificates,
    uploadCertificate,
    getSyllabus,
    saveSyllabusNote,
    sendOTP,
    deleteCertificate,
    getNotifications: getStudentNotifications,
    getStudentNotifications,
    clearStudentNotifications,
    syncATCoins
};
