const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authContactLimiter } = require('../middleware/rateLimiter');
const { loginValidators } = require('../middleware/validators');
const { validationResult } = require('express-validator');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: true });

function runValidation(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	next();
}

router.post('/login', authContactLimiter, loginValidators, runValidation, authController.login);
router.get('/verify', authMiddleware, authController.verify);
router.post('/change-password', authMiddleware, authController.changePassword);

// Expose CSRF token for frontend to use in subsequent state-changing requests
router.get('/csrf-token', csrfProtection, (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
