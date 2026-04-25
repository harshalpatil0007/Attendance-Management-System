const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyEvaluation() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'attendease_db'
    });

    try {
        console.log('Verifying placement eligibility evaluation logic...');

        // Mocking the evaluatePlacementEligibility function logic
        const academic_year = '2025-26';
        const [rulesArr] = await pool.query('SELECT * FROM placement_eligibility_rules WHERE academic_year = ?', [academic_year]);
        const rules = rulesArr[0];
        console.log('Rules:', rules);

        const [students] = await pool.query(`
            SELECT u.id, s.department, s.active_backlogs, s.has_disciplinary_case
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.role = 'student' AND s.current_year = 'BE'
        `);
        console.log(`Evaluating ${students.length} students...`);

        for (const student of students.slice(0, 5)) { // Test with first 5
            const [attRes] = await pool.query(`
                SELECT (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as attendance_pct
                FROM attendance
                WHERE student_id = ?
            `, [student.id]);
            const attendance = attRes[0].attendance_pct || 0;

            const [iseRes] = await pool.query(`
                SELECT AVG((COALESCE(ise_1, 0) + COALESCE(ise_2, 0) + COALESCE(ise_3, 0)) / 3.0) as ise_avg
                FROM ise_marks
                WHERE student_id = ?
            `, [student.id]);
            const iseAvg = iseRes[0].ise_avg || 0;

            const reasons = [];
            if (attendance < rules.min_attendance) reasons.push(`Low Attendance (${Number(attendance).toFixed(1)}%)`);
            if (student.active_backlogs > rules.max_backlogs) reasons.push(`Excess Backlogs (${student.active_backlogs})`);
            if (iseAvg < rules.min_ise_avg) reasons.push(`Low ISE Average (${Number(iseAvg).toFixed(1)}%)`);
            if (rules.enforce_disciplinary && student.has_disciplinary_case) reasons.push('Disciplinary Record');

            const isEligible = reasons.length === 0;
            console.log(`Student ID: ${student.id} | Eligible: ${isEligible} | Reasons: ${reasons.join(', ')}`);
        }

        console.log('Verification logic passed.');
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await pool.end();
    }
}

verifyEvaluation();
