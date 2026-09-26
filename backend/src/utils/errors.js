/**
 * Custom application error class and HTTP error factory helpers.
 * Ensures consistent JSON error payloads across all modules.
 */

export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code
   * @param {string} message - Human-readable error message
   * @param {Array<{ field?: string, message: string }>} [details=[]] - Optional validation or error details
   */
  constructor(statusCode, code, message, details = []) {
    let resolvedStatus = statusCode;
    let resolvedCode = code;
    let resolvedMessage = message;
    let resolvedDetails = details;

    if (typeof statusCode === 'string' && typeof code === 'number') {
      resolvedStatus = code;
      resolvedCode = message;
      resolvedMessage = statusCode;
    }

    super(resolvedMessage);
    this.name = 'AppError';
    this.statusCode = resolvedStatus;
    this.code = resolvedCode;
    this.details = resolvedDetails;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = []) {
    return new AppError(400, 'BAD_JSON', message, details);
  }

  static unauthorized(message = 'Please sign in to continue.', code = 'UNAUTHENTICATED') {
    return new AppError(401, code, message);
  }

  static invalidCredentials(message = "That email or password doesn't look right.") {
    return new AppError(401, 'INVALID_CREDENTIALS', message);
  }

  static tokenExpired(message = 'Your session has expired. Please sign in again.') {
    return new AppError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action.', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static accountInactive(message = 'Your Customer account is currently inactive. Please contact support for help.') {
    return new AppError(403, 'ACCOUNT_INACTIVE', message);
  }

  static accountSuspended(message = 'Your Farmer account has been suspended or rejected. Please contact support.') {
    return new AppError(403, 'ACCOUNT_SUSPENDED', message);
  }

  static notFound(message = 'The requested resource was not found.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message, code = 'EMAIL_TAKEN') {
    return new AppError(409, code, message);
  }

  static payloadTooLarge(message = 'Payload too large. Request body exceeds the 100kb limit.') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static unprocessable(details = [], message = 'Please check the highlighted fields.') {
    if (typeof details === 'string') {
      return new AppError(422, 'VALIDATION_FAILED', details, Array.isArray(message) ? message : message ? [message] : []);
    }
    return new AppError(422, 'VALIDATION_FAILED', message, Array.isArray(details) ? details : details ? [details] : []);
  }

  static validation(details = [], message = 'Please check the highlighted fields.') {
    if (typeof details === 'string') {
      return new AppError(422, 'VALIDATION_FAILED', details, Array.isArray(message) ? message : message ? [message] : []);
    }
    return new AppError(422, 'VALIDATION_FAILED', message, Array.isArray(details) ? details : details ? [details] : []);
  }

  static rateLimited(message = 'Too many requests. Please slow down and try again later.') {
    return new AppError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'An unexpected server error occurred. Please try again.') {
    return new AppError(500, 'INTERNAL', message);
  }
}
