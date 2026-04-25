const express = require('express');
const router = express.Router();
const { 
    getSubstitutionRequests, 
    getAvailableTeachers, 
    createSubstitutionRequest, 
    handleSubstitutionRequest 
} = require('../controllers/substitutionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/requests', protect, getSubstitutionRequests);
router.get('/available-teachers', protect, getAvailableTeachers);
router.post('/request', protect, createSubstitutionRequest);
router.put('/request/:id/:action', protect, handleSubstitutionRequest);

module.exports = router;
