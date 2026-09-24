/**
 * Centralized application error handling middleware.
 * Formats all errors into a standardized JSON response shape and prevents stack trace leakage.
 */

import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // If response headers were already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const reqId = req.id || 'unknown';

  // 1. Handled AppError instance
  if (err instanceof AppError) {
    const errorBody = {
      code: err.code,
      message: err.message,
    };
    if (err.details && err.details.length > 0) {
      errorBody.details = err.details;
    }
    return res.status(err.statusCode).json({ error: errorBody });
  }

  // 2. Malformed JSON syntax error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'BAD_JSON',
        message: 'Malformed JSON payload. Please verify your request body syntax.',
      },
    });
  }

  // 3. Payload too large (express body limit exceeded)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large. Request body exceeds the 100kb limit.',
      },
    });
  }

  // 4. MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const isEmail = err.message && err.message.includes('email');
    return res.status(409).json({
      error: {
        code: isEmail ? 'EMAIL_TAKEN' : 'CONFLICT',
        message: isEmail
          ? 'An account with that email address already exists.'
          : 'A duplicate entry was detected for a unique field.',
      },
    });
  }

  // 5. Invalid BSON / ObjectId errors
  if (err.name === 'BSONError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid identifier format.',
      },
    });
  }

  // 6. Unknown / Uncaught 500 internal server error
  console.error(`[INTERNAL ERROR] [reqId: ${reqId}] ${req.method} ${req.originalUrl}:`, err);

  const errorBody = {
    code: 'INTERNAL',
    message: 'An unexpected server error occurred. Please try again.',
  };

  // Stack traces are NEVER exposed in production or in JSON error responses
  res.status(500).json({ error: errorBody });
}
