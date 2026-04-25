const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

(async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query('SELECT t.id, t.unit_id, t.topic_name, u.unit_number FROM syllabus_topics t JOIN syllabus_units u ON t.unit_id = u.id ORDER BY u.unit_number, t.topic_name');
        
        // Find duplicates
        const seen = new Set();
        const duplicates = [];
        rows.forEach(row => {
            const key = `${row.unit_id}-${row.topic_name}`;
            if (seen.has(key)) {
                duplicates.push(row);
            } else {
                seen.add(key);
            }
        });

        console.log('Total Topics:', rows.length);
        console.log('Duplicates found:', duplicates.length);
        if (duplicates.length > 0) {
            console.log('Duplicate IDs:', duplicates.map(d => d.id).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
})();
