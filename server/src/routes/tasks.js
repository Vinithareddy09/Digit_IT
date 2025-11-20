
const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticate, authorizeTaskAccess } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

/**
 * GET /tasks
 * Return tasks based on role permissions:
 * - Students: only their own tasks
 * - Teachers: tasks they created + tasks of their assigned students
 */
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    const { progress } = req.query; // Optional filter by progress

    let query = {};

    if (user.role === 'student') {
      // Students can only see their own tasks
      query.userId = user._id;
    } else if (user.role === 'teacher') {
      // Teachers can see:
      // 1. Tasks they created (userId = teacher._id)
      // 2. Tasks created by students assigned to them (teacherId = teacher._id)
      
      // Find all students assigned to this teacher
      const assignedStudents = await User.find({ 
        teacherId: user._id,
        role: 'student'
      }).select('_id');
      
      const studentIds = assignedStudents.map(s => s._id);
      
      // Query: tasks where userId is either the teacher OR one of their students
      query.$or = [
        { userId: user._id }, // Tasks created by teacher
        { userId: { $in: studentIds } } // Tasks created by assigned students
      ];
    }

    // Optional progress filter
    if (progress && ['not-started', 'in-progress', 'completed'].includes(progress)) {
      query.progress = progress;
    }

    // Fetch tasks with user information
    const tasks = await Task.find(query)
      .populate('userId', 'email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /tasks
 * Create a new task
 * Authorization: userId must equal JWT user._id (enforced by authorizeTaskAccess)
 */
router.post('/', authorizeTaskAccess, [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('progress')
    .optional()
    .isIn(['not-started', 'in-progress', 'completed'])
    .withMessage('Progress must be one of: not-started, in-progress, completed')
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

    const { title, description, dueDate, progress } = req.body;

    // Create task (userId is set by authorizeTaskAccess middleware)
    const task = await Task.create({
      userId: req.user._id,
      title,
      description: description || '',
      dueDate: dueDate || null,
      progress: progress || 'not-started'
    });

    // Populate user info
    await task.populate('userId', 'email role');

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /tasks/:id
 * Update a task
 * Authorization: Only task owner can update (enforced by authorizeTaskAccess)
 */
router.put('/:id', authorizeTaskAccess, [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('progress')
    .optional()
    .isIn(['not-started', 'in-progress', 'completed'])
    .withMessage('Progress must be one of: not-started, in-progress, completed')
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

    const task = req.task; // Set by authorizeTaskAccess middleware
    const { title, description, dueDate, progress } = req.body;

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (progress !== undefined) task.progress = progress;

    await task.save();

    // Populate user info
    await task.populate('userId', 'email role');

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /tasks/:id
 * Delete a task
 * Authorization: Only task owner can delete (enforced by authorizeTaskAccess)
 */
router.delete('/:id', authorizeTaskAccess, async (req, res, next) => {
  try {
    const task = req.task; // Set by authorizeTaskAccess middleware

    await Task.findByIdAndDelete(task._id);

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
