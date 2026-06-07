const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authContactLimiter } = require('../middleware/rateLimiter');
const { contactValidators } = require('../middleware/validators');
const { validationResult } = require('express-validator');

function runValidation(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	next();
}

router.post('/', authContactLimiter, contactValidators, runValidation, contactController.submitMessage);

module.exports = router;
