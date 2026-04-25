const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getDashboardCharts, 
    getRecentActivity,
    getStudents, 
    getTeachers,
    createUser,
    updateUser,
    deleteUser,
    bulkUploadStudents,
    promoteBatch,
    exportUsersCSV,
    getLiveAttendance,
    getAttendanceAnalytics,
    getDefaulters,
    generateAttendanceCode,
    getGeofencingLogs,
    getISEMarks,
    publishISE,
    getTimetable,
    createTimetable,
    updateTimetable,
    getPendingCertificates,
    verifyCertificate,
    rejectCertificate,
    getPlacementStats, 
    updatePlacementData,
    getEligibleStudents,
    getPlacementRules,
    updatePlacementRules,
    evaluatePlacementEligibility,
    grantEligibilityException,
    revokeEligibilityException,
    notifyIneligibleStudents,
    notifyEligibleStudents,
    getPlacementAnalytics,
    getAttendanceReport,
    getISEPerformanceReport,
    getComplianceReport,
    exportReport,
    sendBulkNotification,
    getNotificationHistory,
    createAnnouncement,
    getSystemSettings,
    updateSystemSetting,
    getAuditLogs,
    getDepartments,
    backupDatabase
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Dashboard Overview
router.get('/dashboard/stats', protect, admin, getDashboardStats);
router.get('/dashboard/charts', protect, admin, getDashboardCharts);
router.get('/dashboard/recent-activity', protect, admin, getRecentActivity);
router.get('/departments', protect, admin, getDepartments);

// User Management
router.get('/users/students', protect, admin, getStudents);
router.get('/users/teachers', protect, admin, getTeachers);
router.post('/users', protect, admin, createUser);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/users/bulk-upload', protect, admin, bulkUploadStudents);
router.post('/users/promote', protect, admin, promoteBatch);
router.get('/users/export', protect, admin, exportUsersCSV);

// Attendance
router.get('/attendance/live', protect, admin, getLiveAttendance);
router.get('/attendance/analytics', protect, admin, getAttendanceAnalytics);
router.get('/attendance/defaulters', protect, admin, getDefaulters);
router.post('/attendance/generate-code', protect, admin, generateAttendanceCode);
router.get('/attendance/geo-fencing-logs', protect, admin, getGeofencingLogs);

// Academic
router.get('/ise/marks', protect, admin, getISEMarks);
router.put('/ise/publish', protect, admin, publishISE);
router.get('/timetable', protect, admin, getTimetable);
router.post('/timetable', protect, admin, createTimetable);
router.put('/timetable/:id', protect, admin, updateTimetable);

// Certificates
router.get('/certificates/pending', protect, admin, getPendingCertificates);
router.put('/certificates/:id/verify', protect, admin, verifyCertificate);
router.put('/certificates/:id/reject', protect, admin, rejectCertificate);

// Placement
router.get('/placement/stats', protect, admin, getPlacementStats);
router.post('/placement/data', protect, admin, updatePlacementData);
router.get('/placement/analytics', protect, admin, getPlacementAnalytics);

// Placement Eligibility
router.get('/placement/eligibility/rules', protect, admin, getPlacementRules);
router.put('/placement/eligibility/rules', protect, admin, updatePlacementRules);
router.post('/placement/eligibility/evaluate', protect, admin, evaluatePlacementEligibility);
router.get('/placement/eligibility/students', protect, admin, getEligibleStudents);
router.post('/placement/eligibility/exception', protect, admin, grantEligibilityException);
router.delete('/placement/eligibility/exception/:id', protect, admin, revokeEligibilityException);
router.post('/placement/eligibility/notify', protect, admin, notifyIneligibleStudents);
router.post('/placement/eligibility/notify-eligible', protect, admin, notifyEligibleStudents);

// Reports
router.get('/reports/attendance', protect, admin, getAttendanceReport);
router.get('/reports/ise-performance', protect, admin, getISEPerformanceReport);
router.get('/reports/compliance', protect, admin, getComplianceReport);
router.get('/reports/export/:type', protect, admin, exportReport);

// Communication
router.post('/notifications/send', protect, admin, sendBulkNotification);
router.get('/notifications/history', protect, admin, getNotificationHistory);
router.post('/announcements', protect, admin, createAnnouncement);

// Settings
router.get('/settings', protect, admin, getSystemSettings);
router.put('/settings/:key', protect, admin, updateSystemSetting);
router.get('/audit-logs', protect, admin, getAuditLogs);
router.post('/backup', protect, admin, backupDatabase);

module.exports = router;

