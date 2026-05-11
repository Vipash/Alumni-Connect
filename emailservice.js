const nodemailer = require('nodemailer');
const path = require('path');

// 1. Better Env Loading: Ensure it looks in the correct directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Must be false for port 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    // This helps if the cloud server has trouble verifying certificates
    rejectUnauthorized: false 
  },
  connectionTimeout: 20000, // Increase to 20 seconds
  greetingTimeout: 20000,
});

const sendVerificationEmail = async (userEmail, userName) => {
  console.log('>>> 1. Inside sendVerificationEmail function');
  console.log(`DEBUG: Attempting to send mail to ${userEmail} for user ${userName}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.log('>>> ERROR: Invalid email address.');
    return { success: false, error: 'Invalid Email' };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('>>> ERROR: Missing Environment Variables');
    return { success: false, error: 'Missing Credentials' };
  }

  const mailOptions = {
    from: `"MBM Alumni Connect" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: 'Action Required: Verify Your Alumni Account',
    html: `
      <div style="font-family: Arial, sans-serif; color: #1a1c4d; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; border-bottom: 2px solid #1a1c4d; padding-bottom: 10px;">
          <h1 style="margin: 0;">MBM Alumni Connect</h1>
        </div>
        <div style="padding: 20px 0;">
          <h2>Hello, ${userName}!</h2>
          <p>Thank you for registering with the <strong>MBM Alumni Connect</strong> portal.</p>
          <p>Our administrators are currently reviewing your details. This process typically takes 24-48 hours. Once verified, you will receive a confirmation email and will have full access to the portal features.</p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding-top: 10px; font-size: 0.9em;">
          <p>Best Regards,</p>
          <p><strong>MBM University Alumni Association</strong></p>
        </div>
      </div>
    `,
  };

  // 2. The Promise Wrapper: This is the critical fix for Render execution
  return new Promise((resolve) => {
    console.log('>>> 2. Attempting transporter.sendMail...');
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('>>> 4. FINAL NODEMAILER ERROR:', error.message);
        resolve({ success: false, error: error.message });
      } else {
        console.log('>>> 3. FINAL SUCCESS! ID:', info.messageId);
        resolve({ success: true, messageId: info.messageId });
      }
    });
  });
};

module.exports = { sendVerificationEmail };