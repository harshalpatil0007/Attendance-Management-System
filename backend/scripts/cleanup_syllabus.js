const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Identifying duplicate topics...');
        const [duplicates] = await connection.query(`
            SELECT unit_id, topic_name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id ASC) as ids
            FROM syllabus_topics
            GROUP BY unit_id, topic_name
            HAVING count > 1
        `);

        console.log(`Found ${duplicates.length} duplicate groups.`);

        for (const group of duplicates) {
            const ids = group.ids.split(',');
            const primaryId = ids[0];
            const redundantIds = ids.slice(1);

            console.log(`Merging topic "${group.topic_name}" (Unit ID: ${group.unit_id}): Keeping ${primaryId}, deleting ${redundantIds.join(', ')}`);

            // 1. Move progress records to primary ID if primary doesn't have one
            for (const oldId of redundantIds) {
                // Check if primary already has progress for this division/teacher
                // This is complex, but for simple deduplication, we can just update if conflict doesn't exist
                await connection.query(`
                    UPDATE IGNORE syllabus_progress 
                    SET topic_id = ? 
                    WHERE topic_id = ?
                `, [primaryId, oldId]);
                
                // Delete remaining progress for the old topic (that couldn't be merged due to unique constraints)
                await connection.query('DELETE FROM syllabus_progress WHERE topic_id = ?', [oldId]);
                
                // Delete the old topic
                await connection.query('DELETE FROM syllabus_topics WHERE id = ?', [oldId]);
            }
        }

        console.log('Identifying duplicate progress records...');
        const [progressDuplicates] = await connection.query(`
            SELECT topic_id, division, COUNT(*) as count, GROUP_CONCAT(id ORDER BY status DESC, last_updated_at DESC) as ids
            FROM syllabus_progress
            GROUP BY topic_id, division
            HAVING count > 1
        `);

        console.log(`Found ${progressDuplicates.length} duplicate progress groups.`);

        for (const group of progressDuplicates) {
            const ids = group.ids.split(',');
            const primaryId = ids[0];
            const redundantIds = ids.slice(1);

            console.log(`Merging progress IDs: Keeping ${primaryId}, deleting ${redundantIds.join(', ')}`);
            await connection.query('DELETE FROM syllabus_progress WHERE id IN (?)', [redundantIds]);
        }

        console.log('Adding unique constraint to syllabus_progress...');
        try {
            await connection.query('ALTER TABLE syllabus_progress ADD UNIQUE UNIQUE_TOPIC_DIVISION (topic_id, division)');
            console.log('Progress unique constraint applied.');
        } catch (err) {
            console.error('Error adding progress unique constraint:', err);
        }

        console.log('Cleanup finished successfully.');
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
};

cleanup();
