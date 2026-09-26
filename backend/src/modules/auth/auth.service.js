/**
 * Authentication service layer.
 * Executes all database operations for user accounts, credentials, sessions, and password resets.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { sha256Hash } from '../../utils/tokens.js';
import { addDays, addMinutes } from '../../utils/time.js';
import { toObjectId } from '../../utils/ids.js';

/**
 * Finds a user by normalized lowercase email.
 * Includes passwordHash for credential verification.
 *
 * @param {string} email
 * @returns {Promise<any|null>}
 */
export async function findUserByEmail(email) {
  const db = getDb();
  // Covered by unique index { email: 1 }
  return db.collection(COLLECTIONS.USERS).findOne(
    { email: email.toLowerCase().trim() },
    {
      projection: {
        _id: 1,
        role: 1,
        name: 1,
        email: 1,
        passwordHash: 1,
        phone: 1,
        address: 1,
        status: 1,
        homeMarketId: 1,
        savedMarketIds: 1,
        notificationPrefs: 1,
        createdAt: 1,
        updatedAt: 1,
        lastLoginAt: 1,
        failedLogins: 1,
        lockUntil: 1,
      },
    }
  );
}

/**
 * Finds a user by ObjectId.
 * Omits sensitive hashes.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<any|null>}
 */
export async function findUserById(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  return db.collection(COLLECTIONS.USERS).findOne(
    { _id: objId },
    {
      projection: {
        passwordHash: 0,
      },
    }
  );
}

/**
 * Finds a user by ObjectId including passwordHash (for change-password verification).
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<any|null>}
 */
export async function findUserByIdWithPassword(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  return db.collection(COLLECTIONS.USERS).findOne({ _id: objId });
}

/**
 * Finds farmer profile by userId.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<any|null>}
 */
export async function findFarmerByUserId(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  // Covered by unique index { userId: 1 }
  return db.collection(COLLECTIONS.FARMERS).findOne({ userId: objId });
}

/**
 * Registers a new Customer.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.phone
 * @param {string} params.email
 * @param {string} params.address
 * @param {string} params.passwordHash
 * @returns {Promise<any>} Created user
 */
export async function registerCustomer({ name, phone, email, address, passwordHash }) {
  const db = getDb();
  const now = new Date();
  const doc = {
    role: 'customer',
    name,
    phone,
    email: email.toLowerCase().trim(),
    address,
    passwordHash,
    status: 'active',
    homeMarketId: null,
    savedMarketIds: [],
    notificationPrefs: {
      orderUpdates: true,
      readyAlerts: true,
      weeklyPicks: false,
      restockAlerts: false,
    },
    emailVerified: false,
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  const result = await db.collection(COLLECTIONS.USERS).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Registers a new Farmer and creates the linked profile document.
 * Implements compensating rollback if profile creation fails.
 *
 * @param {object} params
 * @returns {Promise<{ user: any, farmer: any }>}
 */
export async function registerFarmer({
  stallName,
  contactPerson,
  phone,
  email,
  address,
  passwordHash,
}) {
  const db = getDb();
  const now = new Date();

  // 1. Create the user account with role 'farmer' and status 'pending'
  const userDoc = {
    role: 'farmer',
    name: contactPerson,
    phone,
    email: email.toLowerCase().trim(),
    address,
    passwordHash,
    status: 'pending',
    homeMarketId: null,
    savedMarketIds: [],
    notificationPrefs: {
      orderUpdates: true,
      readyAlerts: true,
      weeklyPicks: false,
      restockAlerts: false,
    },
    emailVerified: false,
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  const userResult = await db.collection(COLLECTIONS.USERS).insertOne(userDoc);
  const createdUserId = userResult.insertedId;

  // 2. Create the associated farmers profile
  try {
    const farmerDoc = {
      userId: createdUserId,
      stallName,
      contactPerson,
      phone,
      email: email.toLowerCase().trim(),
      specialty: 'Local farm produce',
      story: '',
      since: now.getFullYear(),
      stallNumber: 'TBD',
      marketIds: [],
      operatingDays: [],
      pickupWindows: [],
      cutoffMinutesBefore: 720, // default 12 hours
      address,
      location: {
        type: 'Point',
        coordinates: [-74.172, 40.735], // default coordinates
      },
      art: 'crate-carrots',
      listingEnabled: false, // inactive until approved by admin
      ratingAvg: 0,
      ratingCount: 0,
      salesCount: 0,
      isTopSeller: false,
      isNew: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.FARMERS).insertOne(farmerDoc);
    return {
      user: { ...userDoc, _id: createdUserId },
      farmer: farmerDoc,
    };
  } catch (err) {
    // Compensating action: remove the orphaned user record to maintain 1:1 invariant
    await db.collection(COLLECTIONS.USERS).deleteOne({ _id: createdUserId });
    throw err;
  }
}

/**
 * Updates lastLoginAt for a user.
 *
 * @param {string|ObjectId} userId
 */
export async function updateLastLogin(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: objId },
    { $set: { lastLoginAt: new Date(), failedLogins: 0, lockUntil: null } }
  );
}

/**
 * Records a failed sign-in attempt and optionally sets lockUntil.
 *
 * @param {string|ObjectId} userId
 * @param {number} currentFailedCount
 * @returns {Promise<{ failedLogins: number, lockUntil: Date|null }>}
 */
export async function recordFailedLogin(userId, currentFailedCount = 0) {
  const db = getDb();
  const objId = toObjectId(userId);
  const nextCount = currentFailedCount + 1;
  const updateDoc = {
    failedLogins: nextCount,
  };
  if (nextCount >= 5) {
    updateDoc.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: objId },
    { $set: updateDoc }
  );
  return { failedLogins: nextCount, lockUntil: updateDoc.lockUntil || null };
}

/**
 * Resets failed sign-in counters for an account.
 *
 * @param {string|ObjectId} userId
 */
export async function resetFailedLogins(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: objId },
    { $set: { failedLogins: 0, lockUntil: null } }
  );
}

/**
 * Creates a new refresh token session.
 *
 * @param {object} params
 * @param {string|ObjectId} params.userId
 * @param {string} params.rawToken
 * @param {string} [params.userAgent]
 * @param {string} [params.ip]
 * @returns {Promise<any>}
 */
export async function createSession({ userId, rawToken, userAgent, ip }) {
  const db = getDb();
  const now = new Date();
  const tokenHash = sha256Hash(rawToken);
  const expiresAt = addDays(now, 30);

  const doc = {
    userId: toObjectId(userId),
    tokenHash,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    replacedBy: null,
    userAgent: userAgent || 'unknown',
    ip: ip || 'unknown',
  };

  await db.collection(COLLECTIONS.SESSIONS).insertOne(doc);
  return doc;
}

/**
 * Looks up a session by token hash.
 *
 * @param {string} rawToken
 * @returns {Promise<any|null>}
 */
export async function findSessionByToken(rawToken) {
  const db = getDb();
  const tokenHash = sha256Hash(rawToken);
  // Covered by unique index { tokenHash: 1 }
  return db.collection(COLLECTIONS.SESSIONS).findOne({ tokenHash });
}

/**
 * Rotates an existing refresh token session to a new one.
 * Revokes the old session with replacedBy link and inserts the new session.
 *
 * @param {object} params
 * @param {any} params.oldSession
 * @param {string} params.newRawToken
 * @param {string} [params.userAgent]
 * @param {string} [params.ip]
 * @returns {Promise<any>} New session doc
 */
export async function rotateSession({ oldSession, newRawToken, userAgent, ip }) {
  const db = getDb();
  const now = new Date();
  const newTokenHash = sha256Hash(newRawToken);
  const expiresAt = addDays(now, 30);

  const newSessionDoc = {
    userId: oldSession.userId,
    tokenHash: newTokenHash,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    replacedBy: null,
    userAgent: userAgent || oldSession.userAgent,
    ip: ip || oldSession.ip,
  };

  // Insert new session
  await db.collection(COLLECTIONS.SESSIONS).insertOne(newSessionDoc);

  // Invalidate old session with replacedBy pointer
  await db.collection(COLLECTIONS.SESSIONS).updateOne(
    { _id: oldSession._id },
    {
      $set: {
        revokedAt: now,
        replacedBy: newTokenHash,
      },
    }
  );

  return newSessionDoc;
}

/**
 * Revokes a single session by its raw token.
 *
 * @param {string} rawToken
 */
export async function revokeSessionByToken(rawToken) {
  const db = getDb();
  const tokenHash = sha256Hash(rawToken);
  await db.collection(COLLECTIONS.SESSIONS).updateOne(
    { tokenHash },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Revokes all sessions for a user (used on token reuse, password change/reset, sign out everywhere).
 *
 * @param {string|ObjectId} userId
 */
export async function revokeAllUserSessions(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  await db.collection(COLLECTIONS.SESSIONS).updateMany(
    { userId: objId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Creates and stores a password reset token.
 * Expires previous unused reset tokens for this user.
 *
 * @param {string|ObjectId} userId
 * @param {string} rawToken
 */
export async function createPasswordResetToken(userId, rawToken) {
  const db = getDb();
  const objId = toObjectId(userId);
  const now = new Date();
  const tokenHash = sha256Hash(rawToken);
  const expiresAt = addMinutes(now, 30);

  // Invalidate any previously active tokens for this user
  await db.collection(COLLECTIONS.PASSWORD_RESETS).updateMany(
    { userId: objId, usedAt: null },
    { $set: { usedAt: now } }
  );

  await db.collection(COLLECTIONS.PASSWORD_RESETS).insertOne({
    userId: objId,
    tokenHash,
    expiresAt,
    usedAt: null,
  });
}

/**
 * Validates a password reset token.
 *
 * @param {string} rawToken
 * @returns {Promise<any|null>}
 */
export async function findValidPasswordReset(rawToken) {
  const db = getDb();
  const tokenHash = sha256Hash(rawToken);
  // Covered by unique index { tokenHash: 1 }
  return db.collection(COLLECTIONS.PASSWORD_RESETS).findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

/**
 * Completes a password reset:
 * 1. Updates the user's password hash
 * 2. Marks the reset token as used
 * 3. Revokes all active sessions for the user
 *
 * @param {object} params
 * @param {ObjectId} params.resetDocId
 * @param {ObjectId} params.userId
 * @param {string} params.newPasswordHash
 */
export async function completePasswordReset({ resetDocId, userId, newPasswordHash }) {
  const db = getDb();
  const now = new Date();

  // Update user's password hash
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: userId },
    { $set: { passwordHash: newPasswordHash, updatedAt: now } }
  );

  // Mark token as used
  await db.collection(COLLECTIONS.PASSWORD_RESETS).updateOne(
    { _id: resetDocId },
    { $set: { usedAt: now } }
  );

  // Revoke all existing sessions
  await revokeAllUserSessions(userId);
}

/**
 * Changes a user's password.
 *
 * @param {string|ObjectId} userId
 * @param {string} newPasswordHash
 */
export async function updateUserPassword(userId, newPasswordHash) {
  const db = getDb();
  const objId = toObjectId(userId);
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: objId },
    { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
  );
}

/**
 * Creates an email verification token record (24-hour expiry).
 *
 * @param {string|ObjectId} userId
 * @param {string} rawToken
 * @returns {Promise<any>}
 */
export async function createEmailVerificationToken(userId, rawToken) {
  const db = getDb();
  const objId = toObjectId(userId);
  const tokenHash = sha256Hash(rawToken);
  const now = new Date();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).insertOne({
    userId: objId,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: now,
  });
}

/**
 * Invalidates all existing unused verification tokens for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<any>}
 */
export async function invalidatePriorVerificationTokens(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  return db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).updateMany(
    { userId: objId, usedAt: null },
    { $set: { usedAt: new Date() } }
  );
}

/**
 * Counts verification tokens requested in the last hour for rate limiting.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<number>}
 */
export async function countRecentResendRequests(userId) {
  const db = getDb();
  const objId = toObjectId(userId);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).countDocuments({
    userId: objId,
    createdAt: { $gte: oneHourAgo },
  });
}

/**
 * Verifies email token atomically:
 * Finds unused, non-expired token, marks it used, and sets user.emailVerified = true.
 *
 * @param {string} rawToken
 * @returns {Promise<{ success: boolean, user?: any, reason?: string }>}
 */
export async function verifyEmailWithToken(rawToken) {
  const db = getDb();
  const tokenHash = sha256Hash(rawToken);
  const now = new Date();

  // Atomic single-use lookup and consumption
  const tokenDoc = await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).findOneAndUpdate(
    {
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: { usedAt: now },
    },
    { returnDocument: 'after' }
  );

  if (!tokenDoc) {
    // Check if token existed but was already used or expired
    const expiredOrUsed = await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).findOne({ tokenHash });
    if (expiredOrUsed) {
      if (expiredOrUsed.usedAt) {
        return { success: false, reason: 'TOKEN_ALREADY_USED' };
      }
      if (expiredOrUsed.expiresAt <= now) {
        return { success: false, reason: 'TOKEN_EXPIRED' };
      }
    }
    return { success: false, reason: 'TOKEN_INVALID' };
  }

  // Update user document to emailVerified: true
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: tokenDoc.userId },
    {
      $set: {
        emailVerified: true,
        emailVerifiedAt: now,
        updatedAt: now,
      },
    }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: tokenDoc.userId });
  return { success: true, user: updatedUser };
}

