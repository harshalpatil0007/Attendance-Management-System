const express = require('express');
const router = express.Router();
const { 
    getTeacherProfile, 
    getTodaySchedule, 
    getAssignedClasses, 
    getDashboardMetrics,
    updateTeacherProfile,
    changePassword,
    updateTeacherProfileImage,
    deleteTeacherProfileImage,
    getTeacherNotifications,
    clearTeacherNotifications
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for teacher profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics/');
    },
    filename: (req, file, cb) => {
        cb(null, `teacher-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadProfile = multer({ storage: profileStorage });

// All routes protected and restricted to teachers
router.use(protect);
router.use(authorize('teacher', 'admin'));

router.get('/profile', getTeacherProfile);
router.put('/profile', updateTeacherProfile);
router.post('/profile-image', uploadProfile.single('profile_image'), updateTeacherProfileImage);
router.delete('/profile-image', deleteTeacherProfileImage);
router.put('/change-password', changePassword);
router.get('/today-schedule', getTodaySchedule);
router.get('/assigned-classes', getAssignedClasses);
router.get('/dashboard-metrics', getDashboardMetrics);
router.get('/notifications', getTeacherNotifications);
router.post('/clear-notifications', clearTeacherNotifications);

module.exports = router;
