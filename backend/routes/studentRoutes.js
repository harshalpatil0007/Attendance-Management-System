const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateProfileImage, deleteProfileImage, getMarks, getCertificates, uploadCertificate, getSyllabus, saveSyllabusNote, sendOTP, deleteCertificate, getStudentNotifications, clearStudentNotifications } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for certificates
const certStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/certificates/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const uploadCert = multer({ storage: certStorage });

// Multer setup for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics/');
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.params.identifier}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadProfile = multer({ storage: profileStorage });

router.get('/profile/:identifier', protect, getProfile);
router.post('/send-otp', protect, sendOTP);
router.put('/profile/:identifier', protect, updateProfile);
router.post('/profile-image/:identifier', protect, uploadProfile.single('profile_image'), updateProfileImage);
router.delete('/profile-image/:identifier', protect, deleteProfileImage);
router.get('/marks/:prn', protect, getMarks);
router.get('/certificates/:studentId', protect, getCertificates);
router.post('/certificates/upload', protect, uploadCert.single('certificate'), uploadCertificate);
router.delete('/certificates/:id', protect, deleteCertificate);
router.get('/notifications', protect, getStudentNotifications);
router.post('/clear-notifications', protect, clearStudentNotifications);
router.get('/syllabus/:subjectId', protect, getSyllabus);
router.post('/syllabus/note', protect, saveSyllabusNote);

module.exports = router;
