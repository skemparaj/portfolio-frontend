const { body } = require('express-validator');

const contactValidators = [
  body('name').isString().trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').isString().trim().isLength({ min: 5 }).withMessage('Message is required'),
  body('subject').optional().isString().trim()
];

const loginValidators = [
  body('username').isString().trim().notEmpty(),
  body('password').isString().notEmpty()
];

const projectValidators = [
  body('title').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('technologies').isString().trim().notEmpty(),
  body('github_link').optional().isURL().withMessage('Invalid GitHub URL'),
  body('live_link').optional().isURL().withMessage('Invalid Live URL')
];

module.exports = {
  contactValidators,
  loginValidators,
  projectValidators
};
