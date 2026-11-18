const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client;

if (accountSid && authToken && verifyServiceSid) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('⚠️ Twilio credentials missing. SMS verification will not work.');
}

/**
 * Sends a verification code via SMS to the specified phone number.
 * @param {string} phoneNumber - The phone number in E.164 format (e.g., +15555555555)
 * @returns {Promise<boolean>} - True if successful
 */
exports.sendVerificationCode = async (phoneNumber) => {
    if (!client) throw new Error('Twilio not configured');

    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });

        return verification.status === 'pending';
    } catch (error) {
        console.error('Twilio Send Error:', error);
        throw error;
    }
};

/**
 * Checks the verification code entered by the user.
 * @param {string} phoneNumber - The phone number in E.164 format
 * @param {string} code - The 4-6 digit code
 * @returns {Promise<boolean>} - True if approved
 */
exports.checkVerificationCode = async (phoneNumber, code) => {
    if (!client) throw new Error('Twilio not configured');

    try {
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

        return verificationCheck.status === 'approved';
    } catch (error) {
        console.error('Twilio Check Error:', error);
        throw error;
    }
};
