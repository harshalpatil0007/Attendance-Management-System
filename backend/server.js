const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const studentRoutes = require('./routes/studentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const iseRoutes = require('./routes/iseRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentManagementRoutes = require('./routes/studentManagementRoutes');
const expertiseRoutes = require('./routes/expertiseRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const substitutionRoutes = require('./routes/substitutionRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/ise', iseRoutes);
app.use('/api/teacher/student-management', studentManagementRoutes);
app.use('/api/teacher/expertise', expertiseRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/teacher/substitution', substitutionRoutes);
app.use('/api/chatbot', chatbotRoutes);


// Force restart trigger: 2026-04-20
app.get('/', (req, res) => {
    res.send('AttendEase API is running...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const PORT = process.env.PORT || 5000;

console.log('Attempting to start server on port', PORT);
const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Run migration if flagged
    if (process.env.RUN_MIGRATION === 'true') {
        console.log('Running migration...');
        try {
            const migrate = require('./migrate_v2_logic');
            await migrate();
            console.log('Migration successful.');
        } catch (err) {
            console.error('Migration failed:', err.message);
        }
    }
});
