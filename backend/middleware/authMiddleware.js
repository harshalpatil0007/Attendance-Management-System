const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    const adminRoles = ['admin', 'super_admin', 'hod'];
    if (req.user && adminRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const teacherOrAdmin = (req, res, next) => {
    const privilegedRoles = ['teacher', 'admin', 'super_admin', 'hod'];
    if (req.user && privilegedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized for this action' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Expand roles to include implicit permissions (e.g., super_admin can do anything an admin can)
        let expandedRoles = [...roles];
        if (roles.includes('admin')) {
            expandedRoles.push('super_admin', 'hod');
        }

        if (!expandedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, admin, teacherOrAdmin, authorize };
