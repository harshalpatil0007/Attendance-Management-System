const pool = require('./config/db');

const seedNotifications = async () => {
    console.log('Seeding real notifications into database...');
    const connection = await pool.getConnection();

    try {
        // 1. Create a few master announcements
        const announcements = [
            {
                sender_id: 6, // Admin Yash
                sender_role: 'admin',
                title: 'Upcoming Mid-Semester Examination',
                content: 'The Mid-Semester Examination for all departments will commence from May 15th, 2026. Please check the timetable section for details.',
                announcement_type: 'exam',
                priority: 'high',
                target_audience: 'all'
            },
            {
                sender_id: 2, // Teacher Ashish
                sender_role: 'teacher',
                title: 'Lab Manual Submission Deadline',
                content: 'All students are required to submit their DBMS lab manuals by this Friday. Late submissions will not be accepted.',
                announcement_type: 'assignment',
                priority: 'normal',
                target_audience: 'students'
            },
            {
                sender_id: 6, // Admin Yash
                sender_role: 'admin',
                title: 'New Policy: Library Timings Updated',
                content: 'The library will now remain open until 8 PM on weekdays to support exam preparation.',
                announcement_type: 'general',
                priority: 'low',
                target_audience: 'all'
            },
            {
                sender_id: 6, // Admin Yash
                sender_role: 'admin',
                title: 'Faculty Meeting: Academic Audit',
                content: 'Emergency meeting for all faculty members and HODs regarding the upcoming NAAC academic audit.',
                announcement_type: 'urgent',
                priority: 'urgent',
                target_audience: 'colleagues'
            }
        ];

        for (const a of announcements) {
            const [result] = await connection.query(
                `INSERT INTO announcements (sender_id, sender_role, title, content, announcement_type, priority, target_audience, status, sent_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', NOW())`,
                [a.sender_id, a.sender_role, a.title, a.content, a.announcement_type, a.priority, a.target_audience]
            );

            const announcement_id = result.insertId;

            // 2. Assign recipients based on target_audience
            if (a.target_audience === 'all') {
                // All users (Students 1, 5 and Teachers 2, 3)
                const recipients = [1, 5, 2, 3];
                for (const rid of recipients) {
                    await connection.query(
                        `INSERT INTO announcement_recipients (announcement_id, recipient_id) VALUES (?, ?)`,
                        [announcement_id, rid]
                    );
                }
            } else if (a.target_audience === 'students') {
                // Just students 1, 5
                const recipients = [1, 5];
                for (const rid of recipients) {
                    await connection.query(
                        `INSERT INTO announcement_recipients (announcement_id, recipient_id) VALUES (?, ?)`,
                        [announcement_id, rid]
                    );
                }
            } else if (a.target_audience === 'colleagues') {
                // Just teachers 2, 3
                const recipients = [2, 3];
                for (const rid of recipients) {
                    await connection.query(
                        `INSERT INTO announcement_recipients (announcement_id, recipient_id) VALUES (?, ?)`,
                        [announcement_id, rid]
                    );
                }
            }
        }

        console.log('Successfully seeded notifications!');
    } catch (err) {
        console.error('Error seeding notifications:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
};

seedNotifications();
