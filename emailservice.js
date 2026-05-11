const axios = require('axios');

const sendVerificationEmail = async (userEmail, userName, type = 'registration') => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  
  // Define content based on the type of email
  const isApproval = type === 'approval';
  
  const subject = isApproval 
    ? "Account Verified: Welcome to MBM Alumni Connect" 
    : "Action Required: Registration Under Review";

  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
      <h2 style="color: #1a1c4d;">Hello, ${userName}!</h2>
      ${isApproval ? `
        <p>Great news! Your account has been <strong>successfully verified</strong> by our administration team.</p>
        <p>You now have full access to the portal, including the alumni map, member directory, and professional networking features.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://alumni-connect-fegi.onrender.com" 
             style="background-color: #1a1c4d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
             Login to the Portal
          </a>
        </div>
      ` : `
        <p>Thank you for registering with the <strong>MBM Alumni Connect</strong> portal.</p>
        <p>To maintain a secure community, all accounts must be reviewed by an administrator. This process usually takes <strong>24-48 hours</strong>.</p>
        <p>You will receive another email as soon as your account is activated. Thank you for your patience!</p>
      `}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.9em; color: #666;">Best Regards,<br><strong>MBM University Alumni Association</strong></p>
    </div>
  `;

  const data = {
    sender: { name: "MBM Alumni Connect", email: "mrb0tman69420@gmail.com" },
    to: [{ email: userEmail, name: userName }],
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      data: data
    });
    console.log(`>>> SUCCESS! ${type.toUpperCase()} Email Sent. ID:`, response.data.messageId);
    return { success: true };
  } catch (error) {
    console.error(`>>> BREVO ${type.toUpperCase()} ERROR:`, error.response ? JSON.stringify(error.response.data) : error.message);
    return { success: false };
  }
};

module.exports = { sendVerificationEmail };