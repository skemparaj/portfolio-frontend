const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠ EMAIL_USER or EMAIL_PASS not set — using console transport for emails (development).');
  transporter = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // false for 587 (STARTTLS), true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // allow self-signed / restrictive networks
    }
  });
}

// Verify mail configuration on startup
async function verifyMailSetup() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ Email service credentials (EMAIL_USER/EMAIL_PASS) not set in .env. Email alerts will be mocked.');
    return;
  }
  try {
    await transporter.verify();
    console.log('✔ Email transporter verified successfully.');
  } catch (err) {
    console.warn('⚠ Email service configuration error: ' + err.message);
    console.warn('⚠ Email functions will fall back to mock mode.');
  }
}

module.exports = {
  transporter,
  verifyMailSetup
};
