const nodemailer = require('nodemailer');

// Configure email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});

// Test email configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email configuration error:', error.message);
        console.log('❌ Make sure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS are configured');
    } else {
        console.log('✅ Email server is ready');
        console.log('✅ Emails will be sent from:', process.env.EMAIL_USER);
    }
});

// Helper function to send customer emails
const sendCustomerEmail = async (to, subject, htmlContent) => {
    try {
        console.log(`📧 Preparing to send email to customer: ${to}`);
        console.log(`📧 Subject: ${subject}`);

        const mailOptions = {
            //      from: `"HNDY Service" <${process.env.EMAIL_USER}>`,
            from: `"HNDY Service" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Customer email sent successfully to ${to}`);
        console.log(`✅ Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send customer email to ${to}:`, error);
        console.error(`❌ Error details:`, error.message);
        return false;
    }
};

module.exports = {
    transporter,
    sendCustomerEmail
};
