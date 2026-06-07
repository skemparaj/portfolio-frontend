const rateLimit = require('express-rate-limit');

// General rate limiter for all public endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Stricter rate limiter for sensitive actions like Login and Contact Form
const authContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' }
});

module.exports = {
  apiLimiter,
  authContactLimiter
};
