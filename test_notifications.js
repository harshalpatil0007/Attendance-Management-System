const { sendEmail, sendSMS, sendWhatsApp } = require('./backend/utils/notificationService');
require('dotenv').config({ path: './backend/.env' });

async function testNotifications() {
    console.log('--- Notification System Test ---');
    
    // Test Email
    console.log('\nTesting Email...');
    const emailResult = await sendEmail({
        to: 'test@example.com',
        subject: 'SSBT AttendEase Test',
        text: 'This is a test notification from the real-time messaging system.',
        html: '<h3>Test Notification</h3><p>This is a test from SSBT AttendEase.</p>'
    });
    console.log(`Email Test: ${emailResult ? 'PASSED (Check console for mock output if keys missing)' : 'FAILED'}`);

    // Test SMS
    console.log('\nTesting SMS...');
    const smsResult = await sendSMS('+919876543210', 'SSBT AttendEase: Real-time SMS integration active!');
    console.log(`SMS Test: ${smsResult ? 'PASSED (Check console for mock output if keys missing)' : 'FAILED'}`);

    // Test WhatsApp
    console.log('\nTesting WhatsApp...');
    const waResult = await sendWhatsApp('+919876543210', 'SSBT AttendEase: Real-time WhatsApp integration active! 🚀');
    console.log(`WhatsApp Test: ${waResult ? 'PASSED (Check console for mock output if keys missing)' : 'FAILED'}`);
}

testNotifications().catch(console.error);
