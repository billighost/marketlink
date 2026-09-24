/**
 * 404 Not Found middleware.
 * Catches unhandled routes and returns standard JSON error shape.
 */

export function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
}
