const sgMail = require('@sendgrid/mail');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API Key missing. Mocking email sending...');
        console.log(`To: ${to}, Subject: ${subject}`);
        return;
    }

    const msg = {
        to,
        from: process.env.EMAIL_FROM || 'admin@ssbtcoet.ac.in', // Must be a verified sender
        subject,
        text,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
};

/**
 * Send attendance warning to student and parent
 */
const sendAttendanceWarning = async (student, attendanceRate) => {
    const subject = `Attendance Warning: ${student.name}`;
    const html = `
        <h3>Attendance Update for ${student.name}</h3>
        <p>Dear Parent/Guardian,</p>
        <p>This is to inform you that the current attendance of <b>${student.name}</b> (${student.prn_number}) 
        is <b>${attendanceRate.toFixed(1)}%</b>, which is below the mandatory 75% requirement.</p>
        <p>Please ensure regular attendance to avoid eligibility issues for examinations.</p>
        <br>
        <p>Regards,<br>SSBT AttendEase Management</p>
    `;

    await sendEmail({
        to: student.email,
        subject,
        html
    });

    if (student.guardian_email) {
        await sendEmail({
            to: student.guardian_email,
            subject,
            html
        });
    }
};

module.exports = {
    sendEmail,
    sendAttendanceWarning
};
