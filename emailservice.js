const axios = require('axios');
require('dotenv').config();

const sendVerificationEmail = async (userEmail, userName) => {
  // Use .trim() to prevent accidental space errors from Render's env UI
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  
  const data = {
    sender: { name: "MBM Alumni Connect", email: "mrb0tman69420@gmail.com" }, // Use your verified sender
    to: [{ email: userEmail, name: userName }],
    subject: "Action Required: Verify Your Alumni Account",
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2>Hello, ${userName}!</h2>
        <p>Thank you for registering with <strong>MBM Alumni Connect</strong>.</p>
        <p>An administrator is currently reviewing your details. You will be notified once verified.</p>
        <br>
        <p>Best Regards,<br>MBM University Alumni Association</p>
      </div>
    `
  };

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    });
    console.log('>>> SUCCESS! Brevo ID:', response.data.messageId);
    return { success: true };
  } catch (error) {
    console.error('>>> BREVO ERROR:', error.response ? JSON.stringify(error.response.data) : error.message);
    return { success: false };
  }
};

module.exports = { sendVerificationEmail };