
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from Authorization header and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.'
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has permission to perform action on a task
 */
const authorizeTaskAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const taskId = req.params.id;
    const Task = require('../models/Task');

    // For POST /tasks - userId must equal JWT user._id
    if (req.method === 'POST') {
      if (req.body.userId && req.body.userId.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only create tasks for yourself.'
        });
      }
      // Ensure userId is set to current user
      req.body.userId = user._id;
      return next();
    }

    // For PUT and DELETE /tasks/:id - only task owner can update/delete
    if (req.method === 'PUT' || req.method === 'DELETE') {
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required.'
        });
      }

      const task = await Task.findById(taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found.'
        });
      }

      // Only the task owner can update or delete
      if (task.userId.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only modify tasks that you created.'
        });
      }

      req.task = task;
      return next();
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error occurred.'
    });
  }
};

module.exports = {
  authenticate,
  authorizeTaskAccess
};
