const { pool } = require('../config/db');
const { transporter } = require('../config/mail');
require('dotenv').config();

// Submit Contact Message
async function submitMessage(req, res) {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  // Get visitor context if available (from session header)
  const sessionId = req.headers['x-session-id'] || 'anonymous';
  let visitor = null;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM visitors WHERE session_id = ? ORDER BY visit_time DESC LIMIT 1',
      [sessionId]
    );
    if (rows.length > 0) {
      visitor = rows[0];
    }
  } catch (err) {
    console.error('Failed to resolve visitor for message:', err.message);
  }

  try {
    // Save to DB using parameterized query
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || 'No Subject', message]
    );

    const time = new Date().toLocaleString();
    const city = visitor ? visitor.city : 'Unknown';
    const country = visitor ? visitor.country : 'Unknown';
    const ip = visitor ? visitor.ip_address : (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const device = visitor ? `${visitor.device} (${visitor.operating_system} - ${visitor.browser})` : 'Unknown';

    // Send Real-time WebSocket Alert to Dashboard
    if (req.io) {
      req.io.emit('notification', {
        type: 'message',
        title: 'New Message Received!',
        body: `From: ${name} (${email})`,
        time: time
      });
      req.io.emit('new_message_badge'); // triggers badge count update
    }

    // Send emails asynchronously (fast API response)
    sendContactEmails(name, email, subject, message, time, ip, city, country, device);

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
}

// Async Email Sender Function
async function sendContactEmails(name, email, subject, message, time, ip, city, country, device) {
  const adminEmail = process.env.ADMIN_RECEIVER_EMAIL;
  if (!process.env.EMAIL_USER || !adminEmail) return;

  const mailOptionsAdmin = {
    from: `"KS Portfolio Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🚨 Portfolio Message: ${subject || 'New Contact Request'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; background-color: #0b0f19; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #00f5ff; border-bottom: 2px solid #7b2fff; padding-bottom: 10px; margin-top: 0;">New Message Received</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; width: 120px;">Name:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Email:</td>
            <td style="padding: 8px 0; color: #00f5ff;"><a href="mailto:${email}" style="color: #00f5ff; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Subject:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${subject || 'No Subject'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Time:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${time}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #151f32; border-left: 4px solid #7b2fff; border-radius: 4px; color: #f8fafc; font-size: 0.95rem;">
          <strong style="display: block; margin-bottom: 8px; color: #94a3b8;">Message:</strong>
          <span style="white-space: pre-wrap;">${message}</span>
        </div>

        <h3 style="color: #7b2fff; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 25px;">Visitor Metadata</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; width: 120px;">IP Address:</td>
            <td style="padding: 6px 0; color: #f8fafc;">${ip}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
            <td style="padding: 6px 0; color: #f8fafc;">${city}, ${country}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Device / Environment:</td>
            <td style="padding: 6px 0; color: #f8fafc;">${device}</td>
          </tr>
        </table>
      </div>
    `
  };

  const mailOptionsAutoReply = {
    from: `"Kemparaj S" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Thank you for reaching out! - Kemparaj S`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; background-color: #ffffff; color: #334155; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #4f46e5; margin-top: 0; font-size: 1.5rem;">Hello ${name},</h2>
        <p style="font-size: 1rem; line-height: 1.6; color: #475569;">
          Thank you for contacting me! This is an automated confirmation to let you know that I have received your message regarding: 
          <strong style="color: #1e293b;">"${subject || 'Collaboration / Opportunity'}"</strong>.
        </p>
        <p style="font-size: 1rem; line-height: 1.6; color: #475569;">
          I value your interest and will review your message promptly. I strive to respond to all professional inquiries within 24 hours.
        </p>
        <div style="margin: 25px 0; padding: 15px; border-radius: 6px; background-color: #f8fafc; border: 1px dashed #cbd5e1; font-size: 0.9rem; color: #64748b;">
          <strong>My contact information:</strong><br/>
          📧 Email: <a href="mailto:skemparajgms@gmail.com" style="color: #4f46e5; text-decoration: none;">skemparajgms@gmail.com</a><br/>
          💼 LinkedIn: <a href="https://www.linkedin.com/in/kemparaj-s-681812331/" style="color: #4f46e5; text-decoration: none;" target="_blank">linkedin.com/in/kemparaj-s-681812331</a><br/>
          🌐 Portfolio: <a href="https://github.com/skemparaj" style="color: #4f46e5; text-decoration: none;" target="_blank">github.com/skemparaj</a>
        </div>
        <p style="font-size: 1rem; line-height: 1.6; color: #475569; margin-bottom: 0;">
          Best regards,<br/>
          <strong>Kemparaj S</strong><br/>
          <span style="font-size: 0.85rem; color: #94a3b8;">Computer Science Engineering Student & Full-Stack Developer</span>
        </p>
      </div>
    `
  };

  try {
    // Send admin notification
    await transporter.sendMail(mailOptionsAdmin);
    // Send auto-reply to visitor
    await transporter.sendMail(mailOptionsAutoReply);
    console.log(`✉ Emails sent successfully for message from ${name}`);
  } catch (err) {
    console.error('❌ Nodemailer failed to send emails:', err.message);
  }
}

module.exports = {
  submitMessage
};
