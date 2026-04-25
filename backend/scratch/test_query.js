const pool = require('../config/db');

const testQuery = async () => {
    try {
        const academic_year = '2025-26';
        const [eligible] = await pool.query(`
            SELECT pe.*, u.name, u.email, u.mobile_number, s.department
            FROM placement_eligibility pe
            JOIN users u ON pe.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE pe.academic_year = ? AND (pe.is_eligible = TRUE OR pe.is_exception = TRUE)
        `, [academic_year]);

        console.log('Eligible count:', eligible.length);
        if (eligible.length > 0) {
            console.log('First row keys:', Object.keys(eligible[0]));
            console.log('First row student_id:', eligible[0].student_id);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
};

testQuery();
