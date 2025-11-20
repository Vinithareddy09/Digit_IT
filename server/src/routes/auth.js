const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { signupValidator, loginValidator } = require('../middleware/validators');

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'secret';
const loginLimiter = rateLimit({ windowMs: 60*1000, max: 6, message: { success: false, message: 'Too many attempts. Try later.' } });

// Signup
router.post('/signup', signupValidator, async (req, res, next) => {
  try {
    const { email, password, role, teacherId } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    if (role === 'student') {
      if (!teacherId) return res.status(400).json({ success: false, message: 'teacherId required for student' });
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') return res.status(400).json({ success: false, message: 'Invalid teacherId' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role, teacherId: role==='student' ? teacherId : undefined });
    res.json({ success: true, message: 'Signup successful', userId: user._id });
  } catch (err) { next(err); }
});

// Login
router.post('/login', loginLimiter, loginValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, teacherId: user.teacherId } });
  } catch (err) { next(err); }
});

module.exports = router;
