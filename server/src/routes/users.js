// server/src/routes/users.js
const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Public: GET /api/users/teachers
 * Return list of teachers (id + email) for signup dropdown
 * This route is intentionally public so signup page can fetch teachers without auth.
 */
router.get('/teachers', async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('_id email')
      .sort({ email: 1 });

    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    next(error);
  }
});

// All routes below this line require authentication
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current authenticated user's information
 * For students, includes populated teacher information
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = req.user;

    // For students, populate teacher information
    let userData;
    if (user.role === 'student' && user.teacherId) {
      userData = await User.findById(user._id)
        .select('-passwordHash')
        .populate('teacherId', 'email role _id');
    } else {
      // For teachers, no need to populate
      const userObj = user.toObject();
      delete userObj.passwordHash;
      userData = userObj;
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
