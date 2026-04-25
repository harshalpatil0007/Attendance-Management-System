const express = require('express');
const router = express.Router();
const { 
    getTimetable, 
    getTodaySchedule, 
    getStudentWeeklySchedule,
    getTeacherWeeklySchedule,
    getTeacherTodaySchedule,
    getTeacherWorkload
} = require('../controllers/timetableController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.get('/:department/:year/:division', protect, getTimetable);
router.get('/today/:prn', protect, getTodaySchedule);
router.get('/student/weekly/:identifier', protect, getStudentWeeklySchedule);

// Teacher-specific routes
router.get('/teacher/my-timetable', protect, getTeacherWeeklySchedule);
router.get('/teacher/today', protect, getTeacherTodaySchedule);
router.get('/teacher/workload', protect, getTeacherWorkload);

module.exports = router;

