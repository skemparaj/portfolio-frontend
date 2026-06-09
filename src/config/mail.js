const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠ EMAIL_USER or EMAIL_PASS not set.');

  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
} else {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Verify mail configuration on startup
async function verifyMailSetup() {
  try {
    await transporter.verify();
    console.log('✔ Email transporter verified successfully.');
  } catch (err) {
    console.error('❌ Email service configuration error:', err.message);
  }
}

module.exports = {
  transporter,
  verifyMailSetup
};