const twilio = require('twilio');
require('dotenv').config();

const testTwilio = async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const to = '+917757980312'; // The number from the logs

    console.log('--- Twilio Config ---');
    console.log('SID:', sid ? 'Present' : 'Missing');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('From:', from);
    console.log('To:', to);
    console.log('---------------------');

    if (!sid || !token || !from) {
        console.error('Twilio environment variables are missing!');
        process.exit(1);
    }

    const client = twilio(sid, token);

    try {
        console.log('Attempting to send test SMS...');
        const message = await client.messages.create({
            body: 'Test SMS from SSBT AttendEase - ' + new Date().toLocaleTimeString(),
            from: from,
            to: to
        });
        console.log('Success! Message SID:', message.sid);
        console.log('Status:', message.status);
    } catch (error) {
        console.error('Twilio Error:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
        
        if (error.code === 21608) {
            console.warn('\nTIP: This error means the destination number is NOT verified in your Twilio Trial account.');
            console.warn('Go to: https://www.twilio.com/console/phone-numbers/verified');
        }
    }
};

testTwilio();
