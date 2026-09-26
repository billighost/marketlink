/**
 * Authentication and Role-Based Access Control (RBAC) middleware.
 * Verifies JWT access tokens statelessly and enforces role permissions.
 */

import { verifyAccessToken } from '../utils/tokens.js';
import { AppError } from '../utils/errors.js';

/**
 * Requires a valid Bearer JWT access token.
 * Attaches decoded user information { id, role } to req.user.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Please sign in to access this resource.', 'UNAUTHENTICATED'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(AppError.unauthorized('Access token is missing.', 'UNAUTHENTICATED'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces that the authenticated user possesses one of the allowed roles.
 * Must be used after requireAuth.
 *
 * @param {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Please sign in to continue.', 'UNAUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          'You do not have permission to access this resource.',
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

/**
 * Optional authentication: attaches req.user if a valid Bearer token is provided,
 * but allows guest requests through without throwing errors.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.sub,
          role: decoded.role,
        };
      } catch {
        // Silently ignore invalid tokens in optionalAuth
      }
    }
  }
  next();
}
