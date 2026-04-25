const pool = require('../config/db');

const testFullLogic = async () => {
    try {
        const academic_year = '2025-26';
        const [eligible] = await pool.query(`
            SELECT pe.*, u.name, u.email, u.mobile_number, s.department
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE pe.academic_year = ? AND (pe.is_eligible = TRUE OR pe.is_exception = TRUE)
        `, [academic_year]);

        const results = eligible.map(student => {
            return { student: student.name, student_id: student.student_id, emailSent: true, smsSent: true };
        });

        const [annRes] = await pool.query(
            'INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, priority, target_audience, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, "sent", NOW())',
            [1, 'admin', 'Test', 'Test content', 'general', 'high', 'students']
        );
        
        const announcementId = annRes.insertId;
        const recipientValues = eligible.map(s => [announcementId, s.student_id, 'student', 1, 0, 0]);

        if (recipientValues.length > 0) {
            await pool.query(
                'INSERT INTO announcement_recipients (announcement_id, recipient_id, recipient_type, delivered_in_app, delivered_email, delivered_sms) VALUES ?',
                [recipientValues]
            );
        }

        const successCount = results.filter(r => r.emailSent || r.smsSent).length;
        const response = { 
            message: `Success notifications processed. Notified ${successCount}/${eligible.length} students.`,
            details: results
        };

        console.log('JSON response check:');
        console.log(JSON.stringify(response, null, 2));

    } catch (err) {
        console.error('FAILED:', err);
    } finally {
        process.exit();
    }
};

testFullLogic();
