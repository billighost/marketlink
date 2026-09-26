/**
 * Declarative route definition utility.
 * Registers routes on Express routers, automatically attaches auth and rate limiters,
 * and maintains a centralized route manifest for introspection, IDOR verification, and docs synchronization.
 */

import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  contactRateLimiter,
  checkoutRateLimiter,
  assistantRateLimiter,
  reviewRateLimiter,
  uploadRateLimiter,
  exportRateLimiter,
} from '../middleware/rateLimits.js';

// Global manifest storing all declarative routes
const routeManifest = [];
const seenRoutes = new Set();

const LIMITERS = {
  login: loginRateLimiter,
  register: registerRateLimiter,
  forgot: forgotPasswordRateLimiter,
  contact: contactRateLimiter,
  checkout: checkoutRateLimiter,
  assistant: assistantRateLimiter,
  review: reviewRateLimiter,
  upload: uploadRateLimiter,
  export: exportRateLimiter,
};

/**
 * Normalizes an API path by collapsing slashes and removing trailing slash (unless root).
 *
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  const normalized = p.replace(/\/+/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Registers an array of declarative routes onto an Express router.
 *
 * @param {import('express').Router} router
 * @param {string} moduleName
 * @param {Array<object>} routes
 * @param {object} [options]
 * @param {string} [options.basePath]
 */
export function defineRoutes(router, moduleName, routes, options = {}) {
  const basePath = options.basePath || '';

  for (const r of routes) {
    const method = (r.method || 'get').toLowerCase();
    const declaredPath = r.path || '/';

    // Compute routerPath (relative to router mount)
    let routerPath = declaredPath;
    if (basePath && declaredPath.startsWith(basePath)) {
      routerPath = declaredPath.slice(basePath.length) || '/';
    }

    // Compute fullPath (for manifest and documentation)
    let fullPath;
    if (r.fullPath) {
      fullPath = normalizePath(r.fullPath);
    } else if (declaredPath.startsWith('/api')) {
      fullPath = normalizePath(declaredPath);
    } else if (basePath) {
      fullPath = normalizePath(`${basePath}/${declaredPath.replace(/^\//, '')}`);
    } else {
      fullPath = normalizePath(`/api/${declaredPath.replace(/^\//, '')}`);
    }

    const middlewares = [];

    // 1. Rate Limiting
    const limiterName = r.limiter || 'default';
    if (typeof r.limiter === 'function') {
      middlewares.push(r.limiter);
    } else if (LIMITERS[limiterName]) {
      middlewares.push(LIMITERS[limiterName]);
    }

    // 2. Auth & Roles
    const auth = r.auth || 'public';
    let roles = Array.isArray(r.roles) ? [...r.roles] : [];

    if (auth === 'optional') {
      middlewares.push(optionalAuth);
    } else if (auth === 'customer') {
      middlewares.push(requireAuth);
      middlewares.push(requireRole('customer'));
      if (roles.length === 0) roles = ['customer'];
    } else if (auth === 'farmer' || auth === 'vendor') {
      middlewares.push(requireAuth);
      middlewares.push(requireRole('farmer', 'vendor'));
      if (roles.length === 0) roles = ['farmer', 'vendor'];
    } else if (auth === 'admin') {
      middlewares.push(requireAuth);
      middlewares.push(requireRole('admin'));
      if (roles.length === 0) roles = ['admin'];
    } else if (auth === 'any') {
      middlewares.push(requireAuth);
      if (roles.length > 0) {
        middlewares.push(requireRole(...roles));
      } else {
        roles = ['customer', 'farmer', 'admin'];
      }
    } else if (roles.length > 0) {
      middlewares.push(requireAuth);
      middlewares.push(requireRole(...roles));
    }

    // 3. Extra middlewares (e.g. file upload or pre-validation)
    if (Array.isArray(r.middlewares)) {
      middlewares.push(...r.middlewares);
    }

    // 4. Handlers
    const handlers = Array.isArray(r.handler) ? r.handler : [r.handler];

    // Register on the Express router
    router[method](routerPath, ...middlewares, ...handlers);

    // Register in global manifest (deduplicated by METHOD + fullPath)
    const manifestKey = `${method.toUpperCase()} ${fullPath}`;
    if (!seenRoutes.has(manifestKey)) {
      seenRoutes.add(manifestKey);
      routeManifest.push({
        method: method.toUpperCase(),
        fullPath,
        path: routerPath,
        auth,
        roles,
        summary: r.summary || '',
        limiter: typeof r.limiter === 'string' ? r.limiter : (r.limiter ? 'custom' : 'default'),
        body: r.body || null,
        module: moduleName,
      });
    }
  }

  return router;
}

/**
 * Returns a cloned list of all registered routes in the system manifest.
 *
 * @returns {Array<object>}
 */
export function getRouteManifest() {
  return [...routeManifest];
}

/**
 * Resets the in-memory route manifest (for testing purposes).
 */
export function clearRouteManifest() {
  routeManifest.length = 0;
  seenRoutes.clear();
}
