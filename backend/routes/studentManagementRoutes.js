const express = require('express');
const router = express.Router();
const { 
    getTeacherStudents, 
    getStudentDetails, 
    addCounselingNote, 
    logCommunication 
} = require('../controllers/studentManagementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('teacher', 'admin'));

router.get('/', getTeacherStudents);
router.get('/:studentId', getStudentDetails);
router.post('/:studentId/counseling-note', addCounselingNote);
router.post('/:studentId/communication', logCommunication);

module.exports = router;
