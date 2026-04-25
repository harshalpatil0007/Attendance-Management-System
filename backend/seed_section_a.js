const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedTimetable() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Cleaning Existing Section A TE Timetable ---');
        await pool.query('DELETE FROM timetables WHERE department = "Computer Engineering" AND year_level = "TE" AND division = "A"');

        console.log('--- Seeding Updated Section A TE Timetable ---');
        
        const schedule = [
            // MON
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 19, type: 'Lab', room: 'Lab 4' },
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 18, type: 'Lab', room: 'Lab 8' },
            { day: 'Monday', start: '11:00:00', end: '13:00:00', sub: 20, type: 'Lab', room: 'Lab 10' },
            { day: 'Monday', start: '13:45:00', end: '14:45:00', sub: 17, type: 'Theory', room: '115' },
            { day: 'Monday', start: '14:45:00', end: '15:45:00', sub: 3, type: 'Theory', room: '115' },
            { day: 'Monday', start: '15:45:00', end: '16:45:00', sub: 16, type: 'Theory', room: '115' },

            // TUE
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 19, type: 'Lab', room: 'Lab 4' },
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 18, type: 'Lab', room: 'Lab 8' },
            { day: 'Tuesday', start: '11:00:00', end: '13:00:00', sub: 20, type: 'Lab', room: 'Lab 10' },
            { day: 'Tuesday', start: '13:45:00', end: '14:45:00', sub: 13, type: 'Theory', room: '115' },
            { day: 'Tuesday', start: '14:45:00', end: '15:45:00', sub: 3, type: 'Theory', room: '115' },
            { day: 'Tuesday', start: '15:45:00', end: '16:45:00', sub: 17, type: 'Theory', room: '115' },

            // WED
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 19, type: 'Lab', room: 'Lab 4' },
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 18, type: 'Lab', room: 'Lab 8' },
            { day: 'Wednesday', start: '11:00:00', end: '13:00:00', sub: 20, type: 'Lab', room: 'Lab 10' },
            { day: 'Wednesday', start: '13:45:00', end: '14:45:00', sub: 13, type: 'Theory', room: '115' },
            { day: 'Wednesday', start: '2:45:00', end: '15:45:00', sub: 15, type: 'Theory', room: '115' },
            { day: 'Wednesday', start: '15:45:00', end: '16:45:00', sub: 3, type: 'Theory', room: '115' },

            // THU
            { day: 'Thursday', start: '11:00:00', end: '12:00:00', sub: 15, type: 'Theory', room: '316' },
            { day: 'Thursday', start: '12:00:00', end: '13:00:00', sub: 13, type: 'Theory', room: '316' },
            { day: 'Thursday', start: '13:45:00', end: '14:45:00', sub: 16, type: 'Theory', room: '316' },
            { day: 'Thursday', start: '14:45:00', end: '17:45:00', sub: 21, type: 'Theory', room: '316' },

            // FRI
            { day: 'Friday', start: '11:00:00', end: '12:00:00', sub: 15, type: 'Theory', room: '316' },
            { day: 'Friday', start: '12:00:00', end: '13:00:00', sub: 17, type: 'Theory', room: '316' },
            { day: 'Friday', start: '13:45:00', end: '14:45:00', sub: 16, type: 'Theory', room: '316' },
            { day: 'Friday', start: '14:45:00', end: '15:45:00', sub: 22, type: 'Theory', room: '316' },
            { day: 'Friday', start: '15:45:00', end: '17:45:00', sub: 21, type: 'Theory', room: '316' },

            // SAT
            { day: 'Saturday', start: '11:00:00', end: '13:00:00', sub: 21, type: 'Theory', room: '-' },
            { day: 'Saturday', start: '13:45:00', end: '17:45:00', sub: 21, type: 'Theory', room: '-' }
        ];

        for (const s of schedule) {
            await pool.query(
                `INSERT INTO timetables (department, year_level, division, day_of_week, start_time, end_time, subject_id, type, room_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Computer Engineering', 'TE', 'A', s.day, s.start, s.end, s.sub, s.type, s.room]
            );
        }

        console.log('--- Updating Computer Networks Name ---');
        await pool.query('UPDATE subjects SET subject_name = "Computer Networks" WHERE id = 3');

        console.log('Seeding Complete.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

seedTimetable();
