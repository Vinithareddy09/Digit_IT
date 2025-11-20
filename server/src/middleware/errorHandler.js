/**
 * Centralized Error Handler Middleware
 * Returns consistent error response format: { success: false, message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists. Please use a different ${field}.`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format.'
    });
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    const messages = errors.map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Default error
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred.'
  });
};

module.exports = errorHandler;