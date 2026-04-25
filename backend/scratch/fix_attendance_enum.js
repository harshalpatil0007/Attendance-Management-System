const pool = require('../config/db');

async function fixEnum() {
    try {
        console.log("Updating attendance.method enum...");
        await pool.query("ALTER TABLE attendance MODIFY COLUMN method ENUM('face', 'qr', 'code', 'manual')");
        console.log("Attendance method enum updated to include 'manual'.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating enum:", err);
        process.exit(1);
    }
}

fixEnum();
