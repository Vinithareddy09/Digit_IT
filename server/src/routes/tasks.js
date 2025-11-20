const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { taskCreateValidator } = require('../middleware/validators');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /tasks
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role === 'student') {
      // students see their own tasks
      const tasks = await Task.find({ userId: user._id }).sort({ createdAt: -1 });
      return res.json({ success: true, tasks });
    } else {
      // teacher: tasks created by teacher OR tasks belonging to assigned students
      const students = await User.find({ teacherId: user._id }).select('_id');
      const studentIds = students.map(s => s._id);
      const tasks = await Task.find({ $or: [{ userId: user._id }, { userId: { $in: studentIds } }] }).sort({ createdAt: -1 });
      return res.json({ success: true, tasks });
    }
  } catch (err) { next(err); }
});

// POST /tasks
router.post('/', taskCreateValidator, async (req, res, next) => {
  try {
    const user = req.user;
    const { userId, title, description, dueDate } = req.body;

    // created task userId must match logged-in user id
    if (String(user._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'userId must match authenticated user' });
    }

    const task = await Task.create({ userId, title, description, dueDate });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// PUT /tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const user = req.user;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Authorization: Only owner can update
    if (String(task.userId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed to update this task' });
    }

    const allowed = ['title','description','progress','dueDate'];
    allowed.forEach(k => { if (k in req.body) task[k] = req.body[k]; });
    await task.save();
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const user = req.user;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Authorization: Only owner can delete
    if (String(task.userId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed to delete this task' });
    }

    await task.remove();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
