const express = require('express');
const router = express.Router();
const { 
    getAnnouncements, 
    createAnnouncement, 
    getAnnouncementDetails, 
    updateAnnouncement,
    deleteAnnouncement,
    trackAnnouncementView, 
    getAdminNotifications,
    getTemplates,
    uploadAttachment,
    broadcastAnnouncement 
} = require('../controllers/announcementController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for announcement attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/announcements/');
    },
    filename: (req, file, cb) => {
        cb(null, `announcement-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Teacher routes
router.get('/teacher/all', protect, getAnnouncements);
router.post('/teacher/create', protect, createAnnouncement);
router.put('/teacher/update/:id', protect, updateAnnouncement);
router.delete('/teacher/delete/:id', protect, deleteAnnouncement);
router.get('/teacher/details/:id', protect, getAnnouncementDetails);
router.get('/teacher/templates', protect, getTemplates);

// Admin routes
router.get('/admin/notifications', protect, getAdminNotifications);
router.post('/broadcast', protect, admin, broadcastAnnouncement);
router.post('/upload', protect, admin, upload.single('file'), uploadAttachment);

module.exports = router;
