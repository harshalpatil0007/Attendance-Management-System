const { sendSMS, sendWhatsApp } = require('../utils/notificationService');
require('dotenv').config();

async function test() {
    const phone = '9359076826'; // The number from the latest DB entry
    console.log(`Testing SMS to ${phone}...`);
    const sms = await sendSMS(phone, 'Test from AttendEase');
    console.log(`SMS Result: ${sms}`);

    console.log(`Testing WhatsApp to ${phone}...`);
    const wa = await sendWhatsApp(phone, 'Test from AttendEase');
    console.log(`WhatsApp Result: ${wa}`);
}

test().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
