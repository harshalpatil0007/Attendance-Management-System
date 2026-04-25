const express = require('express');
const router = express.Router();
const { 
    getSyllabusProgress, 
    updateTopicStatus, 
    addExtraTopic,
    deleteExtraTopic,
    bulkAction
} = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes protected and restricted to teachers/admins
router.use(protect);
router.use(authorize('teacher', 'admin', 'student'));

router.get('/:subjectId', getSyllabusProgress);

// Teacher only routes
router.put('/topic/:id', authorize('teacher', 'admin'), updateTopicStatus);
router.post('/extra', authorize('teacher', 'admin'), addExtraTopic);
router.delete('/extra/:id', authorize('teacher', 'admin'), deleteExtraTopic);
router.post('/bulk', authorize('teacher', 'admin'), bulkAction);

module.exports = router;
