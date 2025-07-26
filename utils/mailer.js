require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Trading Signal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  };
  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('❌ Error sending email:', err);
  }
}

module.exports = sendEmail;
