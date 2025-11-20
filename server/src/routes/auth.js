
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for login endpoint
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post('/signup', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['student', 'teacher'])
    .withMessage('Role must be either "student" or "teacher"'),
  body('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Teacher ID must be a valid MongoDB ID')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { email, password, role, teacherId } = req.body;

    // Validate role rules: students must have a teacherId
    if (role === 'student' && !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Students must have a valid teacherId.'
      });
    }

    // If teacherId is provided, verify it exists and is a teacher
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher not found. Please provide a valid teacherId.'
        });
      }
      if (teacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'The provided teacherId does not belong to a teacher.'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email or login.'
      });
    }

    // Create new user (password will be hashed in pre-save hook)
    const user = await User.create({
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      role,
      teacherId: role === 'student' ? teacherId : undefined
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Populate teacher info for students
    if (user.role === 'student' && user.teacherId) {
      await user.populate('teacherId', 'email role _id');
    }
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      token,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', loginRateLimit, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Populate teacher info for students
    if (user.role === 'student' && user.teacherId) {
      await user.populate('teacherId', 'email role _id');
    }
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
