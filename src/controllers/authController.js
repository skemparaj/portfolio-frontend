const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();
const logger = require('../utils/logger');

// Auto-seed admin user if empty
async function seedDefaultAdmin() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count === 0) {
      const defaultUser = 'admin';
      const defaultPass = 'admin123';
      const hash = await bcrypt.hash(defaultPass, 10);
      await connection.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [defaultUser, hash]);
      console.log('\n=============================================================');
      console.log('🔑 INITIAL ADMIN ACCOUNT GENERATED');
      console.log(`👤 Username: ${defaultUser}`);
      console.log(`🔒 Password: ${defaultPass}`);
      console.log('⚠ WARNING: Please change this password in production environment!');
      console.log('=============================================================\n');
    }
  } catch (err) {
    console.error('❌ Failed to seed default admin user:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

// Admin Login
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'super_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    // Also set secure httpOnly cookie for production
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    };
    res.cookie('auth_token', token, cookieOptions);
    res.json({ token, admin: { username: admin.username } });
  } catch (err) {
    logger.error('Auth login failed: ' + err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// Verify Session
function verify(req, res) {
  res.json({ success: true, admin: req.admin });
}

// Change Password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, req.admin.id]);
    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  seedDefaultAdmin,
  login,
  verify,
  changePassword
};
