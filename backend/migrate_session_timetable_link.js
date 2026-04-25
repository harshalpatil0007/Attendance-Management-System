const pool = require('./config/db');

const migrate = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await pool.getConnection();
        console.log('Connected.');

        const queries = [
            // 1. Add timetable_id to attendance_sessions
            `ALTER TABLE attendance_sessions ADD COLUMN timetable_id INT;`,
            
            // 2. Add foreign key for timetable_id
            `ALTER TABLE attendance_sessions ADD CONSTRAINT fk_sessions_timetable FOREIGN KEY (timetable_id) REFERENCES timetables(id) ON DELETE SET NULL;`,
            
            // 3. Populate timetable_id for existing sessions if possible (heuristic)
            // This is complex as we'd need to match subject_id, teacher_id, department, year, division, and day_of_week
            // For now, we'll leave them as NULL or try a best-effort update
            `UPDATE attendance_sessions s
             SET s.timetable_id = (
                SELECT t.id FROM timetables t 
                WHERE t.subject_id = s.subject_id 
                AND t.teacher_id = s.teacher_id 
                AND t.department = s.department 
                AND t.year_level = s.year 
                AND t.division = s.division
                AND t.day_of_week = CASE DAYOFWEEK(s.date)
                    WHEN 2 THEN 'Monday'
                    WHEN 3 THEN 'Tuesday'
                    WHEN 4 THEN 'Wednesday'
                    WHEN 5 THEN 'Thursday'
                    WHEN 6 THEN 'Friday'
                    WHEN 7 THEN 'Saturday'
                    WHEN 1 THEN 'Sunday'
                END
                LIMIT 1
             )
             WHERE s.timetable_id IS NULL;`
        ];

        for (let query of queries) {
            try {
                await connection.query(query);
                console.log('Executed query successfully.');
            } catch (err) {
                if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME') {
                    console.log('Constraint already exists, skipping.');
                } else if (err.errno === 1091 || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log('Key/column not found, skipping.');
                } else {
                    console.error('Query failed:', err.message);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
};

migrate();
