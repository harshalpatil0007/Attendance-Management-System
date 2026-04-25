const express = require('express');
const router = express.Router();
const { 
    getStudentsForISE, 
    saveISEMarks, 
    publishISEMarks, 
    getISEAnalysis 
} = require('../controllers/iseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('teacher', 'admin'));

router.get('/students/:subjectId/:year/:division/:iseNumber', getStudentsForISE);
router.post('/marks', saveISEMarks);
router.put('/publish', publishISEMarks);
router.get('/analysis/:subjectId', getISEAnalysis);

module.exports = router;
