const mysql = require('mysql2/promise');
async function run() {
    try {
        const c = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Pratik#1805',
            database: 'attendance_db'
        });
        
        console.log('--- Latest Announcements ---');
        const [anns] = await c.execute("SELECT id, title, target_audience FROM announcements ORDER BY id DESC LIMIT 2");
        console.table(anns);

        if (anns.length > 0) {
            console.log('--- Recipients for Latest Announcement ---');
            const [recipients] = await c.execute("SELECT ar.recipient_id, u.email, u.role FROM announcement_recipients ar JOIN users u ON ar.recipient_id = u.id WHERE ar.announcement_id = ?", [anns[0].id]);
            console.table(recipients);
        }

        await c.end();
    } catch (e) {
        console.log(e);
    }
}
run();
