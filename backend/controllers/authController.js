const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const generateToken = require('../utils/generateToken');
const { generateCaptcha, verifyCaptchaToken } = require('../utils/captchaUtils');
const { sendWelcomeMessage, sendOTPNotification } = require('../utils/notificationService');

// @desc    Send registration OTP
// @route   POST /api/auth/send-registration-otp
// @access  Public
const sendRegistrationOTP = async (req, res) => {
    const { email, mobile_number } = req.body;

    try {
        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) return res.status(400).json({ message: 'Email already registered' });

        // Check if mobile already exists
        const [existingMobile] = await pool.query('SELECT id FROM users WHERE mobile_number = ?', [mobile_number]);
        if (existingMobile.length > 0) return res.status(400).json({ message: 'Mobile number already registered' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await pool.query('INSERT INTO otp_verifications (identifier, otp, expires_at) VALUES (?, ?, ?)', [mobile_number, otp, expires]);

        await sendOTPNotification(mobile_number, email, otp);

        res.json({ message: 'Registration OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error sending registration OTP' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, roll_number, prn_number, mobile_number, department, year_semester, division, role, faceDescriptor, otp } = req.body;

    try {
        if (!otp) return res.status(400).json({ message: 'OTP is required' });

        // Verify OTP
        const [otpRows] = await pool.query(
            'SELECT * FROM otp_verifications WHERE identifier = ? AND otp = ? AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
            [mobile_number, otp]
        );

        if (otpRows.length === 0) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Mark OTP as used
        await pool.query('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [otpRows[0].id]);

        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) return res.status(400).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [userResult] = await connection.query(
                'INSERT INTO users (name, email, password_hash, mobile_number, role) VALUES (?, ?, ?, ?, ?)',
                [name, email, password_hash, mobile_number || null, role || 'student']
            );

            const userId = userResult.insertId;

            if (role === 'teacher') {
                await connection.query('INSERT INTO teachers (user_id, employee_id, department) VALUES (?, ?, ?)', [userId, roll_number, department || null]);
            } else if (role === 'admin') {
                await connection.query('INSERT INTO admins (user_id, employee_id) VALUES (?, ?)', [userId, roll_number]);
            } else {
                await connection.query('INSERT INTO students (user_id, prn_number, department, year_semester, division) VALUES (?, ?, ?, ?, ?)', [userId, roll_number, department || null, year_semester || null, division || null]);
            }

            if (faceDescriptor) {
                await connection.query('INSERT INTO face_embeddings (user_id, embedding_data) VALUES (?, ?)', [userId, JSON.stringify(faceDescriptor)]);
            }

            await connection.commit();
            sendWelcomeMessage({ name, email, mobile_number });

            res.status(201).json({ id: userId, name, email, role: role || 'student', token: generateToken(userId) });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth user & get token (Step 1: Credentials)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password, captchaCode, captchaToken } = req.body;

    if (!verifyCaptchaToken(captchaToken, captchaCode)) {
        return res.status(400).json({ message: 'Invalid or expired captcha' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        // Finalize login immediately
        let department = null;
        let department_access = null;
        if (user.role === 'teacher') {
            const [teacherData] = await pool.query('SELECT department FROM teachers WHERE user_id = ?', [user.id]);
            if (teacherData.length > 0) department = teacherData[0].department;
        } else if (user.role === 'student') {
            const [studentData] = await pool.query('SELECT department FROM students WHERE user_id = ?', [user.id]);
            if (studentData.length > 0) department = studentData[0].department;
        } else if (user.role === 'admin') {
            const [adminData] = await pool.query('SELECT department_access FROM admins WHERE user_id = ?', [user.id]);
            if (adminData.length > 0) department_access = adminData[0].department_access;
        }

        return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department, department_access, token: generateToken(user.id) });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile & faceDescriptor if available
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const [userBase] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
        if (userBase.length === 0) return res.status(404).json({ message: 'User not found' });

        const role = userBase[0].role;
        let profileQuery = '';

        if (role === 'student') {
            profileQuery = `
                SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.profile_image, 
                       s.roll_number, s.prn_number, 
                       CASE 
                           WHEN s.department IN ('CSE', 'Computer Science', 'Computer Engineering', 'IT') THEN 'Computer Engineering'
                           WHEN s.department IN ('ETC', 'Electronics (ETC)', 'Electronics & Telecommunications Engg.') THEN 'Electronics & Telecommunications Engg.'
                           WHEN s.department IN ('MECH', 'Mechanical (MECH)', 'Mechanical Engineering') THEN 'Mechanical Engineering'
                           WHEN s.department IN ('Civil', 'Civil Engineering') THEN 'Civil Engineering'
                           WHEN s.department IN ('Chemical', 'Chemical Engineering') THEN 'Chemical Engineering'
                           WHEN s.department IN ('Electrical', 'Electrical Engineering') THEN 'Electrical Engineering'
                           WHEN s.department IN ('First Year', 'FE', 'First Year Engineering') THEN 'First Year Engineering'
                           ELSE s.department 
                       END as department,
                       COALESCE(NULLIF(s.current_year, ''), s.year_semester) as current_year, 
                       s.division, s.at_coins
                FROM users u
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.id = ?`;
        } else if (role === 'teacher') {
            profileQuery = `
                SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.profile_image, 
                       t.employee_id, t.department, t.designation
                FROM users u
                LEFT JOIN teachers t ON u.id = t.user_id
                WHERE u.id = ?`;
        } else {
            profileQuery = `
                SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.profile_image, 
                       a.employee_id, a.admin_level
                FROM users u
                LEFT JOIN admins a ON u.id = a.user_id
                WHERE u.id = ?`;
        }

        const [user] = await pool.query(profileQuery, [req.user.id]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Profile data not found' });
        }

        const [face] = await pool.query('SELECT embedding_data FROM face_embeddings WHERE user_id = ?', [req.user.id]);

        res.json({
            ...user[0],
            hasFaceRegistered: face.length > 0,
            faceDescriptor: face.length > 0 
                ? (typeof face[0].embedding_data === 'string' ? JSON.parse(face[0].embedding_data) : face[0].embedding_data) 
                : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { mobile_number } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE mobile_number = ?', [mobile_number]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User with this mobile number not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await pool.query('UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE mobile_number = ?', [otp, expires, mobile_number]);

        // SEND REAL OTP
        await sendOTPNotification(mobile_number, users[0].email, otp);

        res.json({ message: 'OTP sent to registered mobile number' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { mobile_number, otp } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE mobile_number = ? AND reset_otp = ? AND reset_otp_expires > NOW()', [mobile_number, otp]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { mobile_number, otp, newPassword } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE mobile_number = ? AND reset_otp = ? AND reset_otp_expires > NOW()', [mobile_number, otp]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?', [password_hash, users[0].id]);

        res.json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Captcha
// @route   GET /api/auth/captcha
// @access  Public
const getCaptcha = (req, res) => {
    const { svg, token } = generateCaptcha();
    res.json({ svg, captchaToken: token });
};

// @desc    Update face descriptor
// @route   PUT /api/auth/profile/face
// @access  Private
const updateFaceDescriptor = async (req, res) => {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({ message: 'Invalid face descriptor data' });
    }

    try {
        const userId = req.user.id;

        // Check if embedding already exists
        const [existing] = await pool.query('SELECT id FROM face_embeddings WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            // Update existing
            await pool.query(
                'UPDATE face_embeddings SET embedding_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [JSON.stringify(faceDescriptor), userId]
            );
        } else {
            // Insert new
            await pool.query(
                'INSERT INTO face_embeddings (user_id, embedding_data) VALUES (?, ?)',
                [userId, JSON.stringify(faceDescriptor)]
            );
        }

        res.json({ message: 'Face data updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during face update' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, forgotPassword, verifyOtp, resetPassword, getCaptcha, updateFaceDescriptor, sendRegistrationOTP };
