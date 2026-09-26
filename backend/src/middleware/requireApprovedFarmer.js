/**
 * Farmer Approval and Account Status Verification Middleware.
 * Enforces the access-token window requirement (D4):
 * While access tokens are valid for up to 15 minutes statelessly, mutating Farmer routes
 * perform a lightweight indexed query (findOne({ _id: userId }, { projection: { status: 1 } }))
 * to immediately reject suspended or non-approved farmers without waiting for token expiry.
 *
 * Trade-off: Mutating requests incur one fast, indexed primary key lookup (<1ms) to eliminate
 * the 15-minute token invalidation window, while read-only requests remain completely stateless.
 */

import { getDb } from '../db/client.js';
import { COLLECTIONS } from '../db/collections.js';
import { toObjectId } from '../utils/ids.js';
import { AppError } from '../utils/errors.js';

/**
 * Requires the authenticated farmer to have status 'active'.
 * Returns 403 FARMER_NOT_APPROVED for pending accounts.
 * Returns 403 ACCOUNT_SUSPENDED for suspended or rejected accounts.
 */
export async function requireApprovedFarmer(req, res, next) {
  if (!req.user || (req.user.role !== 'farmer' && req.user.role !== 'vendor')) {
    return next(AppError.forbidden('Only farmers can access this resource.', 'FORBIDDEN'));
  }

  try {
    const db = getDb();
    const userId = toObjectId(req.user.id);
    const user = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ _id: userId }, { projection: { status: 1, name: 1 } });

    if (!user) {
      return next(AppError.unauthorized('User account not found.', 'UNAUTHENTICATED'));
    }

    if (user.status === 'suspended') {
      return next(
        new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact support.')
      );
    }

    if (user.status === 'rejected') {
      return next(
        new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account application was not approved.')
      );
    }

    if (user.status === 'pending') {
      return next(
        new AppError(
          403,
          'FARMER_NOT_APPROVED',
          'Your stall is waiting for approval. You can add products once it is approved.'
        )
      );
    }

    if (user.status !== 'active') {
      return next(
        new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account is not active.')
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Allows active or pending farmers to mutate their profile,
 * but immediately rejects suspended or rejected farmers with 403 ACCOUNT_SUSPENDED.
 */
export async function requireNotSuspendedFarmer(req, res, next) {
  if (!req.user || (req.user.role !== 'farmer' && req.user.role !== 'vendor')) {
    return next(AppError.forbidden('Only farmers can access this resource.', 'FORBIDDEN'));
  }

  try {
    const db = getDb();
    const userId = toObjectId(req.user.id);
    const user = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ _id: userId }, { projection: { status: 1 } });

    if (!user) {
      return next(AppError.unauthorized('User account not found.', 'UNAUTHENTICATED'));
    }

    if (user.status === 'suspended' || user.status === 'rejected') {
      return next(
        new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact support.')
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
