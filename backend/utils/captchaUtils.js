const svgCaptcha = require('svg-captcha');
const jwt = require('jsonwebtoken');

/**
 * Generate a new captcha SVG and a signed token containing the text.
 * @returns {Object} { svg, token }
 */
const generateCaptcha = () => {
    const captcha = svgCaptcha.create({
        size: 6, // length of captcha
        noise: 2, // number of noise lines
        color: true,
        background: '#f8f9fa'
    });

    const token = jwt.sign(
        { captchaText: captcha.text.toLowerCase() },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    );

    return {
        svg: captcha.data,
        token
    };
};

/**
 * Verify if the provided text matches the text in the token.
 * @param {string} token - The signed captcha token
 * @param {string} text - The user's guess
 * @returns {boolean}
 */
const verifyCaptchaToken = (token, text) => {
    if (!token || !text) return false;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.captchaText === text.toLowerCase();
    } catch (error) {
        return false;
    }
};

module.exports = {
    generateCaptcha,
    verifyCaptchaToken
};
