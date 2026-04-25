const pool = require('../config/db');

// @desc    Get all announcements for a teacher
// @route   GET /api/teacher/announcements
const getAnnouncements = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const { type, audience, status } = req.query;

        let query = `SELECT * FROM announcements WHERE sender_id = ?`;
        let params = [teacher_id];

        if (type && type !== 'all') {
            query += ` AND announcement_type = ?`;
            params.push(type);
        }
        if (audience && audience !== 'all') {
            query += ` AND target_audience = ?`;
            params.push(audience);
        }
        if (status && status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        query += ` ORDER BY is_pinned DESC, created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching announcements' });
    }
};

// @desc    Create a new announcement
// @route   POST /api/teacher/announcements
const createAnnouncement = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            title, content, announcement_type, priority, target_audience,
            subject_id, department, year, division, specific_recipients,
            channels, attachments, is_scheduled, scheduled_at, expires_at,
            is_pinned, status
        } = req.body;

        const sender_id = req.user.id;
        const sender_role = req.user.role || 'teacher';

        // Fallback for department if missing (useful for Quick Update)
        let finalDepartment = department;
        if (!finalDepartment && (sender_role === 'teacher' || sender_role === 'hod')) {
            const [profile] = await connection.query('SELECT department FROM teachers WHERE user_id = ?', [sender_id]);
            if (profile.length > 0) finalDepartment = profile[0].department;
        }

        // Insert into announcements table
        const [result] = await connection.query(
            `INSERT INTO announcements (
                sender_id, sender_role, title, content, announcement_type, priority, 
                target_audience, subject_id, department, year, division, 
                specific_recipients, channels, attachments, is_scheduled, 
                scheduled_at, expires_at, is_pinned, status, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sender_id, sender_role, title, content, announcement_type, priority,
                target_audience, subject_id || null, finalDepartment || null, year || null, division || null,
                JSON.stringify(specific_recipients || []),
                JSON.stringify(channels || ['in_app']),
                JSON.stringify(attachments || []),
                is_scheduled || false,
                scheduled_at || null,
                expires_at || null,
                is_pinned || false,
                status || 'draft',
                status === 'sent' ? new Date() : null
            ]
        );

        const announcement_id = result.insertId;

        // If status is 'sent', handle recipient creation
        if (status === 'sent') {
            let recipientQuery = `SELECT id FROM users WHERE role = 'student'`;
            let recipientParams = [];

            if (target_audience === 'students') {
                if (department || year || division) {
                    let studentSubQuery = `WHERE 1=1`;
                    let studentSubParams = [];
                    
                    if (department) {
                        studentSubQuery += ` AND s.department = ?`;
                        studentSubParams.push(department);
                    }
                    if (year) {
                        studentSubQuery += ` AND (s.current_year = ? OR s.year_semester = ?)`;
                        studentSubParams.push(year, year);
                    }
                    if (division) {
                        studentSubQuery += ` AND s.division = ?`;
                        studentSubParams.push(division);
                    }

                    recipientQuery = `
                        SELECT u.id FROM users u
                        JOIN students s ON u.id = s.user_id
                        ${studentSubQuery}
                    `;
                    recipientParams = studentSubParams;
                } else if (subject_id) {
                    // ...
                }
            } else if (target_audience === 'hod') {
                // HOD notifications go to admins of that department
                // Match search word in department_access (e.g., 'Computer Engineering' inside 'Computer Engineering, IT')
                recipientQuery = `
                    SELECT u.id FROM users u
                    JOIN admins a ON u.id = a.user_id
                    WHERE u.role = 'admin' AND (a.department_access IS NULL OR a.department_access LIKE ?)
                `;
                recipientParams = [`%${department}%` || '%'];
            } else if (target_audience === 'colleagues') {
                recipientQuery = `
                    SELECT u.id FROM users u
                    JOIN teachers t ON u.id = t.user_id
                    WHERE u.role = 'teacher' AND t.department = ? AND u.id != ?
                `;
                recipientParams = [department, sender_id];
            } else if (target_audience === 'all') {
                recipientQuery = `SELECT id FROM users WHERE role IN ('student', 'teacher')`;
                recipientParams = [];
            }

            const [recipients] = await connection.query(recipientQuery, recipientParams);

            if (recipients.length > 0) {
                const getRecipientType = (audience) => {
                    switch (audience) {
                        case 'students': return 'student';
                        case 'parents': return 'parent';
                        case 'colleagues': return 'teacher';
                        case 'hod': return 'hod';
                        default: return 'user';
                    }
                };
                const values = recipients.map(r => [announcement_id, r.id, getRecipientType(target_audience)]);
                await connection.query(
                    `INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type) VALUES ?`,
                    [values]
                );

                // Update total recipients count
                await connection.query(
                    `UPDATE announcements SET total_recipients = ? WHERE id = ?`,
                    [recipients.length, announcement_id]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Announcement created successfully', announcement_id });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error creating announcement' });
    } finally {
        connection.release();
    }
};

// @desc    Get announcement details with tracking
// @route   GET /api/teacher/announcements/:id
const getAnnouncementDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [announcement] = await pool.query(
            `SELECT a.*, s.subject_name, s.subject_code 
             FROM announcements a 
             LEFT JOIN subjects s ON a.subject_id = s.id 
             WHERE a.id = ?`,
            [id]
        );

        if (announcement.length === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const [recipients] = await pool.query(
            `SELECT ar.*, u.name, u.email, s.roll_number 
             FROM announcement_recipients ar
             JOIN users u ON ar.recipient_id = u.id
             LEFT JOIN students s ON u.id = s.user_id
             WHERE ar.announcement_id = ?`,
            [id]
        );

        res.json({ ...announcement[0], recipients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching announcement details' });
    }
};

// @desc    Track announcement view
// @route   POST /api/announcements/:id/view
const trackAnnouncementView = async (req, res) => {
    try {
        const { id } = req.params;
        const recipient_id = req.user.id;
        const { device } = req.body;

        const [result] = await pool.query(
            `UPDATE announcement_recipients 
             SET viewed = TRUE, viewed_at = CURRENT_TIMESTAMP, view_device = ?
             WHERE announcement_id = ? AND recipient_id = ? AND viewed = FALSE`,
            [device || 'Unknown', id, recipient_id]
        );

        if (result.affectedRows > 0) {
            await pool.query(
                `UPDATE announcements SET viewed_count = viewed_count + 1 WHERE id = ?`,
                [id]
            );
        }

        res.json({ message: 'View tracked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error tracking view' });
    }
};

// @desc    Get templates for a teacher
// @route   GET /api/teacher/announcements/templates
const getTemplates = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const [rows] = await pool.query(
            `SELECT * FROM announcement_templates WHERE teacher_id = ? ORDER BY usage_count DESC`,
            [teacher_id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching templates' });
    }
};

// @desc    Update an announcement
// @route   PUT /api/teacher/announcements/update/:id
const updateAnnouncement = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const sender_id = req.user.id;
        const {
            title, content, announcement_type, priority, target_audience,
            subject_id, department, year, division, specific_recipients,
            channels, attachments, is_scheduled, scheduled_at, expires_at,
            is_pinned, status
        } = req.body;

        // Check ownership
        const [existing] = await connection.query(`SELECT status FROM announcements WHERE id = ? AND sender_id = ?`, [id, sender_id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Announcement not found or unauthorized' });
        }

        const prevStatus = existing[0].status;

        // Update announcement
        await connection.query(
            `UPDATE announcements SET 
                title = ?, content = ?, announcement_type = ?, priority = ?, 
                target_audience = ?, subject_id = ?, department = ?, year = ?, division = ?, 
                specific_recipients = ?, channels = ?, attachments = ?, is_scheduled = ?, 
                scheduled_at = ?, expires_at = ?, is_pinned = ?, status = ?, 
                sent_at = ?
            WHERE id = ?`,
            [
                title, content, announcement_type, priority,
                target_audience, subject_id, department, year, division,
                JSON.stringify(specific_recipients || []),
                JSON.stringify(channels || ['in_app']),
                JSON.stringify(attachments || []),
                is_scheduled || false,
                scheduled_at || null,
                expires_at || null,
                is_pinned || false,
                status || 'draft',
                (status === 'sent' && prevStatus !== 'sent') ? new Date() : (prevStatus === 'sent' ? new Date() : null),
                id
            ]
        );

        // If transitioning to 'sent', handle recipients
        if (status === 'sent' && prevStatus !== 'sent') {
            let recipientQuery = `SELECT id FROM users WHERE role = 'student'`;
            let recipientParams = [];

            if (target_audience === 'students') {
                if (department && year && division) {
                    recipientQuery = `
                        SELECT u.id FROM users u
                        JOIN students s ON u.id = s.user_id
                        WHERE s.department = ? AND (s.current_year = ? OR s.year_semester = ?) AND s.division = ?
                    `;
                    recipientParams = [department, year, year, division];
                } else if (subject_id) {
                    recipientQuery = `
                        SELECT u.id FROM users u
                        JOIN students s ON u.id = s.user_id
                        JOIN teacher_assignments ta ON s.department = ta.department 
                            AND s.current_year = ta.year 
                            AND s.division = ta.division
                        WHERE ta.subject_id = ? AND ta.teacher_id = ?
                    `;
                    recipientParams = [subject_id, sender_id];
                }
            } else if (target_audience === 'hod') {
                recipientQuery = `SELECT id FROM users WHERE role = 'hod' AND department = ?`;
                recipientParams = [department];
            } else if (target_audience === 'colleagues') {
                recipientQuery = `SELECT id FROM users WHERE role = 'teacher' AND department = ? AND id != ?`;
                recipientParams = [department, sender_id];
            }

            const [recipients] = await connection.query(recipientQuery, recipientParams);

            if (recipients.length > 0) {
                const getRecipientType = (audience) => {
                    switch (audience) {
                        case 'students': return 'student';
                        case 'parents': return 'parent';
                        case 'colleagues': return 'teacher';
                        case 'hod': return 'hod';
                        default: return 'user';
                    }
                };
                const values = recipients.map(r => [id, r.id, getRecipientType(target_audience)]);
                await connection.query(
                    `INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type) VALUES ?`,
                    [values]
                );

                await connection.query(
                    `UPDATE announcements SET total_recipients = ? WHERE id = ?`,
                    [recipients.length, id]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Announcement updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error updating announcement' });
    } finally {
        connection.release();
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/teacher/announcements/delete/:id
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const sender_id = req.user.id;

        // Delete recipients first (due to FK although usually cascade is better, let's be safe)
        await pool.query(`DELETE FROM announcement_recipients WHERE announcement_id = ?`, [id]);
        
        const [result] = await pool.query(
            `DELETE FROM announcements WHERE id = ? AND sender_id = ?`,
            [id, sender_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found or unauthorized' });
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};

// @desc    Get admin notifications (from HOD audience)
// @route   GET /api/admin/notifications
const getAdminNotifications = async (req, res) => {
    try {
        const admin_id = req.user.id;
        // Fetch announcements where this admin is a recipient
        const [notifications] = await pool.query(
            `SELECT a.*, u.name as sender_name, u.role as sender_role
             FROM announcements a
             JOIN announcement_recipients ar ON a.id = ar.announcement_id
             JOIN users u ON a.sender_id = u.id
             WHERE ar.recipient_id = ? AND a.status = 'sent' AND ar.is_cleared = FALSE
             ORDER BY a.sent_at DESC LIMIT 20`,
            [admin_id]
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error in getAdminNotifications:', error);
        res.status(500).json({ message: 'Server error fetching admin notifications' });
    }
};

// @desc    Upload announcement attachment
// @route   POST /api/announcements/upload
const uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const fileUrl = `/uploads/announcements/${req.file.filename}`;
        res.json({ 
            url: fileUrl, 
            name: req.file.originalname,
            type: req.file.mimetype 
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Error uploading attachment' });
    }
};

// @desc    Broadcast announcement from Admin
// @route   POST /api/announcements/broadcast
const broadcastAnnouncement = async (req, res) => {
    // Map the admin broadcast form to the standard createAnnouncement structure
    const { title, content, target_role, target_dept, target_year, target_div, priority, attachments } = req.body;
    
    // Create a mock req object to reuse createAnnouncement
    const mockReq = {
        user: req.user,
        body: {
            title,
            content,
            announcement_type: 'general',
            priority: priority || 'normal',
            target_audience: target_role === 'all' ? 'all' : (target_role === 'teacher' ? 'colleagues' : 'students'),
            department: target_dept === 'all' ? null : target_dept,
            year: target_year === 'all' ? null : target_year,
            division: target_div === 'all' ? null : target_div,
            status: 'sent',
            attachments: attachments || [],
            channels: ['in_app']
        }
    };

    // We can call createAnnouncement directly or refactor it. 
    // To minimize risk, I'll pass it to createAnnouncement logic but wrapped.
    return createAnnouncement(mockReq, res);
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    getAnnouncementDetails,
    updateAnnouncement,
    deleteAnnouncement,
    trackAnnouncementView,
    getAdminNotifications,
    getTemplates,
    uploadAttachment,
    broadcastAnnouncement
};
