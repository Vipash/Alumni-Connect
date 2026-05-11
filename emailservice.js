const axios = require('axios'); // You may need to run: npm install axios

const sendVerificationEmail = async (userEmail, userName) => {
  console.log('>>> 1. Initializing API Email for:', userEmail);

  const apiKey = process.env.BREVO_API_KEY; // Add this to Render Environment
  
  const data = {
    sender: { name: "MBM Alumni Connect", email: process.env.GMAIL_USER },
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
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('>>> 3. SUCCESS! Message ID:', response.data.messageId);
    return { success: true };
  } catch (error) {
    console.error('>>> 4. API ERROR:', error.response ? error.response.data : error.message);
    return { success: false };
  }
};

module.exports = { sendVerificationEmail };