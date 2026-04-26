const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yourpassword',
    database: process.env.DB_NAME || 'attendance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_HOST !== 'localhost' ? {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    } : null
});

module.exports = pool;
