const pool = require('../config/db');

const testNotifyEligible = async () => {
    const req = {
        body: { academic_year: '2025-26' },
        user: { id: 1, role: 'admin' }
    };

    const academic_year = req.body.academic_year;

    try {
        const [eligible] = await pool.query(`
            SELECT pe.*, u.name, u.email, u.mobile_number, s.department
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE pe.academic_year = ? AND (pe.is_eligible = TRUE OR pe.is_exception = TRUE)
        `, [academic_year]);

        console.log('Eligible count:', eligible.length);

        if (eligible.length === 0) {
            console.log('No eligible students');
            return;
        }

        // Mock announcement creation
        const [annRes] = await pool.query(
            'INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, priority, target_audience, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
            [req.user.id, req.user.role, 'Congratulations: Placement Eligible!', `Evaluation for ${academic_year} is complete. You have been marked as ELIGIBLE for placements.`, 'general', 'high', 'students']
        );
        
        const announcementId = annRes.insertId;
        console.log('Announcement created:', announcementId);

        const recipientValues = eligible.map(s => [announcementId, s.student_id, 'student', 1, 0, 0]);
        console.log('Recipient values count:', recipientValues.length);

        if (recipientValues.length > 0) {
            await pool.query(
                'INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type, delivered_in_app, delivered_email, delivered_sms) VALUES ?',
                [recipientValues]
            );
            console.log('Recipients inserted');
        }

    } catch (err) {
        console.error('CRASHED with error:', err);
    } finally {
        process.exit();
    }
};

testNotifyEligible();
