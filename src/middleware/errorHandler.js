/**
 * Centralized 404 Not Found handler.
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

/**
 * Centralized error handling middleware.
 */
function errorHandler(err, _req, res, _next) {
  // Handle malformed JSON payloads from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON payload'
    });
  }

  // Handle SQLite constraint errors
  if (err && err.code === 'SQLITE_CONSTRAINT') {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A record with this unique value already exists'
      });
    }
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Operation violates a foreign key constraint'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Constraint Error',
      message: err.message
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('[Server Error]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
