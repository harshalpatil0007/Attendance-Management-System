const express = require('express');
const router = express.Router();
const { 
    markAttendance, 
    getStudentAttendance, 
    getAllSubjects,
    startSession,
    stopSession,
    markManualAttendance,
    getSessionLiveAttendance,
    getClassStudents,
    getActiveSessionForStudent
} = require('../controllers/attendanceController');
const {
    getHistorySessions,
    getSessionDetail,
    updateSessionAttendance,
    getAttendanceAnalytics,
    getConsolidatedAttendance,
    deleteSession
} = require('../controllers/historyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, markAttendance);
router.get('/student', protect, getStudentAttendance);
router.get('/subjects', protect, getAllSubjects);
router.get('/active-session/:subjectId', protect, getActiveSessionForStudent);

// Teacher routes
router.post('/session/start', protect, authorize('teacher', 'admin'), startSession);
router.post('/session/stop/:id', protect, authorize('teacher', 'admin'), stopSession);
router.post('/mark-manual', protect, authorize('teacher', 'admin'), markManualAttendance);
router.get('/live-session/:id', protect, authorize('teacher', 'admin'), getSessionLiveAttendance);
router.get('/class-students', protect, authorize('teacher', 'admin'), getClassStudents);

// History & Analytics
router.get('/history', protect, authorize('teacher', 'admin'), getHistorySessions);
router.get('/session/:id', protect, authorize('teacher', 'admin'), getSessionDetail);
router.put('/edit-session', protect, authorize('teacher', 'admin'), updateSessionAttendance);
router.get('/analytics', protect, authorize('teacher', 'admin'), getAttendanceAnalytics);
router.get('/consolidated-report', protect, authorize('teacher', 'admin'), getConsolidatedAttendance);
router.delete('/session/:id', protect, authorize('teacher', 'admin'), deleteSession);

module.exports = router;
