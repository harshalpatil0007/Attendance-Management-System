const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTeacherExpertise,
    getMasterData,
    updateSubjectExpertise,
    updateLabExpertise,
    updateProgrammingSkills,
    addMasterSubject,
    deleteMasterSubject,
    addMasterLab,
    deleteMasterLab
} = require('../controllers/expertiseController');

router.use(protect);

router.get('/', getTeacherExpertise);
router.get('/master-data', getMasterData);
router.post('/subjects', updateSubjectExpertise);
router.post('/labs', updateLabExpertise);
router.post('/skills', updateProgrammingSkills);

// Master Data Management
router.post('/master/subjects', addMasterSubject);
router.delete('/master/subjects/:id', deleteMasterSubject);
router.post('/master/labs', addMasterLab);
router.delete('/master/labs/:id', deleteMasterLab);

module.exports = router;
