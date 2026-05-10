const nodemailer = require('nodemailer');
// Ensure dotenv is loaded so process.env works
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // Uses the values from your .env file
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS
  }
});

/**
 * Sends a verification email to the user.
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - The name of the user
 */
const sendVerificationEmail = async (userEmail, userName) => {
  const mailOptions = {
    // Using the GMAIL_USER variable here keeps it consistent
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
          <p>If you have any questions, feel free to reply to this email or contact support.</p>
        </div>
        <br />
        <div style="border-top: 1px solid #eeeeee; padding-top: 10px; font-size: 0.9em;">
          <p>Best Regards,</p>
          <p><strong>MBM University Alumni Association</strong></p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendVerificationEmail };