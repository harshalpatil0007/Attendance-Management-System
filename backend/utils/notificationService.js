const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
require('dotenv').config();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key') {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Normalize phone number to E.164 format
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10) return `+91${clean}`;
    if (clean.length === 12 && clean.startsWith('91')) return `+${clean}`;
    return phone.startsWith('+') ? phone : `+${clean}`;
};

/**
 * Send Email via SendGrid
 */
const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key') {
        console.warn('SendGrid API Key missing. Mocking email sending...');
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return true;
    }

    const msg = {
        to,
        from: process.env.EMAIL_FROM || 'admin@ssbtcoet.ac.in',
        subject,
        text,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log(`[EMAIL] Sent to ${to}`);
        return true;
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response && error.response.body) {
            console.error('SendGrid Response Body:', JSON.stringify(error.response.body, null, 2));
        }
        return false;
    }
};

/**
 * Send SMS via Twilio
 */
const sendSMS = async (to, message) => {
    if (!twilioClient) {
        console.warn('Twilio SID missing. Mocking SMS sending...');
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return true;
    }

    const formattedTo = normalizePhone(to);
    console.log(`[TWILIO] Attempting SMS to ${formattedTo}...`);
    
    try {
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Twilio Timeout')), 10000)
        );

        const messageResponse = await Promise.race([
            twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedTo
            }),
            timeoutPromise
        ]);

        console.log(`[SMS] Sent to ${formattedTo}. SID: ${messageResponse.sid}`);
        return true;
    } catch (error) {
        console.warn(`[TWILIO SMS ERROR] ${error.message}`);
        
        // Handle Twilio Trial Account Restriction (Unverified Number) or Daily Limit Exceeded
        if (error.code === 21608 || error.code === 63038 || error.code === 20429 || error.message === 'Twilio Timeout') {
            const reason = error.message === 'Twilio Timeout' ? 'TIMEOUT' :
                          error.code === 63038 ? 'DAILY LIMIT EXCEEDED' : 
                          error.code === 20429 ? 'RATE LIMIT EXCEEDED' : 'UNVERIFIED NUMBER';
            console.warn(`[TWILIO SMS ${reason}] ${error.message}`);
            console.log(`[MOCK SMS] To: ${formattedTo}, Message: ${message}`);
            return true; // Return true to allow dev flow to continue with logs
        }
        
        return false;
    }
};

/**
 * Send WhatsApp via Twilio
 */
const sendWhatsApp = async (to, message) => {
    if (!twilioClient) {
        console.warn('Twilio SID missing. Mocking WhatsApp sending...');
        console.log(`[MOCK WHATSAPP] To: ${to}, Message: ${message}`);
        return true;
    }

    const formattedTo = normalizePhone(to);
    console.log(`[TWILIO] Attempting WhatsApp to ${formattedTo}...`);
    
    try {
        // Add a timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Twilio Timeout')), 10000)
        );

        await Promise.race([
            twilioClient.messages.create({
                body: message,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${formattedTo}`
            }),
            timeoutPromise
        ]);

        console.log(`[WHATSAPP] Sent to ${formattedTo}`);
        return true;
    } catch (error) {
        console.warn(`[TWILIO WHATSAPP ERROR] ${error.message}`);
        
        // Handle Twilio Trial Account Restriction (Unverified Number) or Daily Limit Exceeded
        if (error.code === 21608 || error.code === 63038 || error.code === 20429 || error.message === 'Twilio Timeout') {
            const reason = error.message === 'Twilio Timeout' ? 'TIMEOUT' :
                          error.code === 63038 ? 'DAILY LIMIT EXCEEDED' : 
                          error.code === 20429 ? 'RATE LIMIT EXCEEDED' : 'UNVERIFIED NUMBER';
            console.warn(`[TWILIO WHATSAPP ${reason}] ${error.message}`);
            console.log(`[MOCK WHATSAPP] To: ${formattedTo}, Message: ${message}`);
            return true; // Return true to allow dev flow to continue with logs
        }
        if (error.code === 63007) {
            console.warn(`[WHATSAPP SANDBOX] Cannot send to ${formattedTo}. User has not joined the sandbox.`);
            return false;
        }
        return false;
    }
};

/**
 * High-level helper: Send Welcome Message
 */
const sendWelcomeMessage = async (user) => {
    const subject = 'Welcome to SSBT AttendEase';
    const html = `
        <h3>Welcome ${user.name}!</h3>
        <p>Your account has been successfully registered on SSBT AttendEase.</p>
        <p>You can now mark your attendance and track your academic progress in real-time.</p>
        <br>
        <p>Regards,<br>Team AttendEase</p>
    `;
    
    await sendEmail({ to: user.email, subject, html });
    
    if (user.mobile_number) {
        const smsText = `Welcome to SSBT AttendEase, ${user.name}! Your account is now active.`;
        await sendSMS(user.mobile_number, smsText);
    }
};

/**
 * High-level helper: Send OTP
 */
const sendOTPNotification = async (mobile, email, otp) => {
    const message = `Your SSBT AttendEase verification code is: ${otp}. Valid for 5 minutes.`;
    
    // Log OTP to console for debugging/development
    console.log('-----------------------------------------');
    console.log(`[OTP DEBUG] To: ${mobile} / ${email}`);
    console.log(`[OTP DEBUG] Code: ${otp}`);
    console.log('-----------------------------------------');

    if (mobile) {
        await sendSMS(mobile, message);
        // Also try WhatsApp if possible (Reliable for real-time in India)
        await sendWhatsApp(mobile, message);
    }
    if (email) await sendEmail({ 
        to: email, 
        subject: 'Your Verification Code', 
        text: message,
        html: `<h3>Verification Code</h3><p>${message}</p>`
    });
};

/**
 * High-level helper: Attendance Confirmation
 */
const sendAttendanceConfirmation = async (student, subjectName) => {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const message = `Attendance marked for ${subjectName} on ${dateStr} at ${timeStr}. Status: PRESENT. - SSBT AttendEase`;
    
    // 1. Send SMS
    if (student.mobile_number) {
        await sendSMS(student.mobile_number, message);
    }
    
    // 2. Send Email
    if (student.email) {
        const subject = `Attendance Confirmation: ${subjectName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%); padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Attendance Marked</h2>
                </div>
                <div style="padding: 30px; color: #1e293b;">
                    <p>Dear <strong>${student.name}</strong>,</p>
                    <p>Your attendance for the following lecture has been successfully recorded:</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr><td style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Subject</td></tr>
                            <tr><td style="font-size: 18px; font-weight: bold; padding-bottom: 15px;">${subjectName}</td></tr>
                            <tr><td style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Date & Time</td></tr>
                            <tr><td style="font-size: 16px;">${dateStr} | ${timeStr}</td></tr>
                            <tr><td style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; padding-top: 15px;">Status</td></tr>
                            <tr><td><span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: bold;">PRESENT</span></td></tr>
                        </table>
                    </div>
                    <p>Thank you for being regular!</p>
                    <br>
                    <p style="font-size: 12px; color: #94a3b8;">Regards,<br>Team AttendEase Management System</p>
                </div>
            </div>
        `;
        await sendEmail({ to: student.email, subject, text: message, html });
    }
};

module.exports = {
    sendEmail,
    sendSMS,
    sendWhatsApp,
    sendWelcomeMessage,
    sendOTPNotification,
    sendAttendanceConfirmation
};
