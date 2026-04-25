const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

// The route is Public, but we pass 'protect' optionally if possible, 
// or we just check the token in the controller.
// However, 'protect' usually throws if no token.
// Let's create an 'optionalProtect' middleware or just check in controller manually.

// Simple helper to optionally attach user
const optionalProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const db = require('../config/db');
            const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
            if (users.length > 0) {
                req.user = users[0];
            }
        } catch (error) {
            console.error("Optional Auth Error:", error.message);
        }
    }
    next();
};

router.post('/message', optionalProtect, handleMessage);

module.exports = router;
