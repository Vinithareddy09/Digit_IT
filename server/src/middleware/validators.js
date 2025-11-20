const { body, validationResult } = require('express-validator');

const signupValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['student','teacher']).withMessage('Role must be student or teacher'),
  body('teacherId').if(body('role').equals('student')).notEmpty().withMessage('teacherId required for students'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    next();
  }
];

const loginValidator = [
  body('email').isEmail(),
  body('password').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    next();
  }
];

const taskCreateValidator = [
  body('userId').notEmpty().withMessage('userId required'),
  body('title').notEmpty().withMessage('title required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    next();
  }
];

module.exports = { signupValidator, loginValidator, taskCreateValidator };
