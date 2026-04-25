const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, forgotPassword, verifyOtp, resetPassword, getCaptcha, updateFaceDescriptor, sendRegistrationOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/send-registration-otp', sendRegistrationOTP);
router.post('/login', loginUser);
router.get('/captcha', getCaptcha);
router.get('/profile', protect, getUserProfile);
router.put('/profile/face', protect, updateFaceDescriptor);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
