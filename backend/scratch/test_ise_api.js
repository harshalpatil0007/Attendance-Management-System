const pool = require('../config/db');

async function test() {
    const subjectId = '3';
    const year = 'TE';
    const division = 'A';
    const iseNumber = 'ISE-1';

    try {
        console.log(`Testing with: subjectId=${subjectId}, year=${year}, division=${division}, iseNumber=${iseNumber}`);
        
        const [assignment] = await pool.query(
            'SELECT department FROM teacher_assignments WHERE subject_id = ? AND division = ? AND year = ?',
            [subjectId, division, year]
        );
        
        if (assignment.length === 0) {
            console.log('Assignment not found');
            process.exit(0);
        }

        console.log('Assignment found:', assignment[0]);

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
        `, [subjectId, subjectId, iseNumber, assignment[0].department, year, division]);

        console.log('Students found:', students.length);
        console.log('First student:', students[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
}

test();
