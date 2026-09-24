/**
 * Users routing layer.
 * Manages user profile fetching, profile updates, password modification, and global session termination.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../utils/errors.js';
import { toApi, isValidObjectId, toObjectId } from '../../utils/ids.js';
import { sha256Hash } from '../../utils/tokens.js';
import {
  rejectUnknownFields,
  validateString,
  validatePassword,
  assertValid,
} from '../../utils/validate.js';
import {
  findUserById,
  findUserByIdWithPassword,
  revokeAllUserSessions,
} from '../auth/auth.service.js';
import {
  updateUserProfile,
  updateUserPassword,
  getSavedMarkets,
  saveMarket,
  removeSavedMarket,
  setHomeMarket,
} from './users.service.js';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';

export const usersRouter = Router();

// GET /users/me - Get full user profile
usersRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  res.status(200).json({
    data: {
      user: toApi(user),
    },
  });
});

// PATCH /users/me - Update permitted profile fields
usersRouter.patch('/me', requireAuth, async (req, res) => {
  const allowed = [
    'name',
    'phone',
    'address',
    'homeMarketId',
    'savedMarketIds',
    'notificationPrefs',
  ];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const updates = {};

  if (req.body.name !== undefined) {
    updates.name = validateString(req.body.name, 'name', details, { required: true, min: 2, max: 100 });
  }

  if (req.body.phone !== undefined) {
    updates.phone = validateString(req.body.phone, 'phone', details, { required: false, min: 7, max: 30 });
  }

  if (req.body.address !== undefined) {
    updates.address = validateString(req.body.address, 'address', details, { required: false, min: 3, max: 255 });
  }

  if (req.body.homeMarketId !== undefined) {
    if (req.body.homeMarketId === null || req.body.homeMarketId === '') {
      updates.homeMarketId = null;
    } else if (isValidObjectId(req.body.homeMarketId)) {
      updates.homeMarketId = toObjectId(req.body.homeMarketId);
    } else {
      details.push({ field: 'homeMarketId', message: 'homeMarketId must be a valid identifier or null.' });
    }
  }

  if (req.body.savedMarketIds !== undefined) {
    if (!Array.isArray(req.body.savedMarketIds)) {
      details.push({ field: 'savedMarketIds', message: 'savedMarketIds must be an array.' });
    } else {
      updates.savedMarketIds = req.body.savedMarketIds.map((id) => (isValidObjectId(id) ? toObjectId(id) : id));
    }
  }

  if (req.body.notificationPrefs !== undefined) {
    if (typeof req.body.notificationPrefs !== 'object' || req.body.notificationPrefs === null || Array.isArray(req.body.notificationPrefs)) {
      details.push({ field: 'notificationPrefs', message: 'notificationPrefs must be an object.' });
    } else {
      updates.notificationPrefs = req.body.notificationPrefs;
    }
  }

  assertValid(details);

  const updatedUser = await updateUserProfile(req.user.id, updates);
  if (!updatedUser) {
    throw AppError.notFound('User not found.');
  }

  res.status(200).json({
    data: {
      user: toApi(updatedUser),
    },
  });
});

// POST /users/me/password - Change password
usersRouter.post('/me/password', requireAuth, async (req, res) => {
  const allowed = ['currentPassword', 'newPassword'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const currentPassword = validateString(req.body.currentPassword, 'currentPassword', details, { required: true, min: 1, max: 128 });
  const newPassword = validatePassword(req.body.newPassword, 'newPassword', details, true);
  assertValid(details);

  const user = await findUserByIdWithPassword(req.user.id);
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw AppError.invalidCredentials('Current password does not match.');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(req.user.id, newHash);

  // Revoke other active sessions except current session
  const currentToken = req.cookies?.refreshToken;
  const db = getDb();
  if (currentToken) {
    const currentHash = sha256Hash(currentToken);
    await db.collection(COLLECTIONS.SESSIONS).updateMany(
      {
        userId: toObjectId(req.user.id),
        tokenHash: { $ne: currentHash },
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } }
    );
  } else {
    await revokeAllUserSessions(req.user.id);
  }

  res.status(200).json({
    data: {
      message: 'Password updated successfully.',
    },
  });
});

// DELETE /users/me/sessions - Sign out of all devices
usersRouter.delete('/me/sessions', requireAuth, async (req, res) => {
  await revokeAllUserSessions(req.user.id);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json({
    data: {
      message: 'Signed out of all devices successfully.',
    },
  });
});

// GET /users/me/saved-markets
usersRouter.get('/me/saved-markets', requireAuth, async (req, res) => {
  const markets = await getSavedMarkets(req.user.id);
  res.status(200).json({
    data: markets,
  });
});

// PUT /users/me/saved-markets/:marketId (idempotent, max 10)
usersRouter.put('/me/saved-markets/:marketId', requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.marketId)) {
    throw AppError.notFound('Market not found.');
  }

  const result = await saveMarket(req.user.id, req.params.marketId);
  res.status(200).json({
    data: result,
  });
});

// DELETE /users/me/saved-markets/:marketId (idempotent)
usersRouter.delete('/me/saved-markets/:marketId', requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.marketId)) {
    throw AppError.notFound('Market not found.');
  }

  const result = await removeSavedMarket(req.user.id, req.params.marketId);
  res.status(200).json({
    data: result,
  });
});

// PUT /users/me/home-market/:marketId
usersRouter.put('/me/home-market/:marketId', requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.marketId)) {
    throw AppError.notFound('Market not found.');
  }

  const result = await setHomeMarket(req.user.id, req.params.marketId);
  res.status(200).json({
    data: result,
  });
});

