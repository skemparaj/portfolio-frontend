const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    // Support Bearer token in Authorization header or auth_token cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies && req.cookies.auth_token) token = req.cookies.auth_token;

    if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session expired or invalid token.' });
  }
};
