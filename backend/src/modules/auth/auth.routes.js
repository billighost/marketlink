/**
 * Authentication router.
 * Handles registration, credential sign-in, token refresh rotation, password recovery, and session invalidation.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { toApi } from '../../utils/ids.js';
import { generateRandomToken, signAccessToken } from '../../utils/tokens.js';
import { mailer } from '../../utils/mailer.js';
import {
  rejectUnknownFields,
  validateString,
  validateEmail,
  validatePassword,
  assertValid,
} from '../../utils/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
} from '../../middleware/rateLimits.js';
import {
  findUserByEmail,
  findUserById,
  findFarmerByUserId,
  registerCustomer,
  registerFarmer,
  updateLastLogin,
  createSession,
  findSessionByToken,
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  createPasswordResetToken,
  findValidPasswordReset,
  completePasswordReset,
} from './auth.service.js';

export const authRouter = Router();

// Standard cookie options for HTTP-only refresh tokens
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Dummy bcrypt hash to equalize timing against non-existent accounts
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuv';

// ── 1. Register Customer ──
authRouter.post('/register/customer', registerRateLimiter, async (req, res) => {
  const allowed = ['name', 'phone', 'email', 'address', 'password'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const name = validateString(req.body.name, 'name', details, { required: true, min: 2, max: 100 });
  const phone = validateString(req.body.phone, 'phone', details, { required: true, min: 7, max: 30 });
  const email = validateEmail(req.body.email, 'email', details, true);
  const address = validateString(req.body.address, 'address', details, { required: true, min: 3, max: 255 });
  const password = validatePassword(req.body.password, 'password', details, true);

  assertValid(details);

  const existing = await findUserByEmail(email);
  if (existing) {
    throw AppError.conflict(
      'An account with this email address already exists. Please sign in instead.',
      'EMAIL_TAKEN'
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await registerCustomer({
    name,
    phone,
    email,
    address,
    passwordHash,
  });

  const rawRefreshToken = generateRandomToken(48);
  await createSession({
    userId: user._id,
    rawToken: rawRefreshToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({
    data: {
      user: toApi(user),
      accessToken,
    },
  });
});

// ── 2. Register Farmer ──
authRouter.post('/register/farmer', registerRateLimiter, async (req, res) => {
  const allowed = ['stallName', 'contactPerson', 'phone', 'email', 'address', 'password'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const stallName = validateString(req.body.stallName, 'stallName', details, { required: true, min: 2, max: 120 });
  const contactPerson = validateString(req.body.contactPerson, 'contactPerson', details, { required: true, min: 2, max: 100 });
  const phone = validateString(req.body.phone, 'phone', details, { required: true, min: 7, max: 30 });
  const email = validateEmail(req.body.email, 'email', details, true);
  const address = validateString(req.body.address, 'address', details, { required: true, min: 3, max: 255 });
  const password = validatePassword(req.body.password, 'password', details, true);

  assertValid(details);

  const existing = await findUserByEmail(email);
  if (existing) {
    throw AppError.conflict(
      'An account with this email address already exists. Please sign in instead.',
      'EMAIL_TAKEN'
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { user } = await registerFarmer({
    stallName,
    contactPerson,
    phone,
    email,
    address,
    passwordHash,
  });

  const rawRefreshToken = generateRandomToken(48);
  await createSession({
    userId: user._id,
    rawToken: rawRefreshToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({
    data: {
      user: toApi(user),
      accessToken,
    },
  });
});

// ── 3. Login ──
authRouter.post('/login', loginRateLimiter, async (req, res) => {
  const allowed = ['email', 'password'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const email = validateEmail(req.body.email, 'email', details, true);
  const password = validateString(req.body.password, 'password', details, { required: true, min: 1, max: 128 });

  assertValid(details);

  const user = await findUserByEmail(email);
  if (!user) {
    // Perform dummy bcrypt comparison to neutralize timing attacks
    await bcrypt.compare(password, DUMMY_HASH);
    throw AppError.invalidCredentials();
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw AppError.invalidCredentials();
  }

  // Account status verification
  if (user.role === 'customer' && user.status === 'inactive') {
    throw AppError.accountInactive();
  }

  if (user.role === 'farmer' && (user.status === 'suspended' || user.status === 'rejected')) {
    throw AppError.accountSuspended();
  }

  // Farmer with status 'pending' is allowed to log in (status is returned so UI can inform them)
  await updateLastLogin(user._id);

  const rawRefreshToken = generateRandomToken(48);
  await createSession({
    userId: user._id,
    rawToken: rawRefreshToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({
    data: {
      user: toApi(user),
      accessToken,
    },
  });
});

// ── 4. Refresh ──
authRouter.post('/refresh', async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  if (!rawRefreshToken) {
    throw AppError.unauthorized('Refresh token is missing.', 'UNAUTHENTICATED');
  }

  const session = await findSessionByToken(rawRefreshToken);
  if (!session) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    throw AppError.unauthorized('Invalid refresh session.', 'UNAUTHENTICATED');
  }

  // Reuse detection: token was already revoked or rotated
  if (session.revokedAt || session.replacedBy) {
    // Revoke all active sessions for this user due to potential token theft
    await revokeAllUserSessions(session.userId);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    throw AppError.unauthorized(
      'Suspicious session reuse detected. All sessions have been terminated. Please sign in again.',
      'UNAUTHENTICATED'
    );
  }

  // Expiry check
  if (new Date(session.expiresAt) < new Date()) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    throw AppError.tokenExpired('Refresh session expired. Please sign in again.');
  }

  const user = await findUserById(session.userId);
  if (!user) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    throw AppError.unauthorized('User not found.', 'UNAUTHENTICATED');
  }

  // Check account status rules
  if (user.role === 'customer' && user.status === 'inactive') {
    throw AppError.accountInactive();
  }
  if (user.role === 'farmer' && (user.status === 'suspended' || user.status === 'rejected')) {
    throw AppError.accountSuspended();
  }

  // Rotate token
  const newRawToken = generateRandomToken(48);
  await rotateSession({
    oldSession: session,
    newRawToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  res.cookie('refreshToken', newRawToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({
    data: {
      accessToken,
      user: toApi(user),
    },
  });
});

// ── 5. Logout ──
authRouter.post('/logout', async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  if (rawRefreshToken) {
    await revokeSessionByToken(rawRefreshToken);
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(204).end();
});

// ── 6. Current User (GET /auth/me) ──
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw AppError.unauthorized('User account no longer exists.', 'UNAUTHENTICATED');
  }

  const userObj = { ...user };
  if (user.role === 'farmer') {
    const farmerProfile = await findFarmerByUserId(user._id);
    userObj.farmer = {
      stallName: farmerProfile ? farmerProfile.stallName : 'My Stall',
      approvalStatus: user.status,
    };
  }

  res.status(200).json({
    data: {
      user: toApi(userObj),
    },
  });
});

// ── 7. Forgot Password ──
authRouter.post('/forgot-password', forgotPasswordRateLimiter, async (req, res) => {
  const allowed = ['email'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const email = validateEmail(req.body.email, 'email', details, true);
  assertValid(details);

  const user = await findUserByEmail(email);
  if (user) {
    const rawResetToken = generateRandomToken(32);
    await createPasswordResetToken(user._id, rawResetToken);
    const resetLink = `${env.APP_BASE_URL}/reset-password?token=${rawResetToken}`;
    await mailer.sendPasswordReset(user.email, resetLink);
  }

  // Always return 200 with identical warm message to prevent user enumeration
  res.status(200).json({
    data: {
      message: "If an account with that email exists, we've sent password reset instructions.",
    },
  });
});

// ── 8. Reset Password ──
authRouter.post('/reset-password', async (req, res) => {
  const allowed = ['token', 'password'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const token = validateString(req.body.token, 'token', details, { required: true, min: 10, max: 128 });
  const password = validatePassword(req.body.password, 'password', details, true);
  assertValid(details);

  const resetRecord = await findValidPasswordReset(token);
  if (!resetRecord) {
    throw AppError.badRequest('Invalid, expired, or already used password reset link.');
  }

  const newPasswordHash = await bcrypt.hash(password, 10);
  await completePasswordReset({
    resetDocId: resetRecord._id,
    userId: resetRecord.userId,
    newPasswordHash,
  });

  res.status(200).json({
    data: {
      message: 'Your password has been successfully reset. Please sign in with your new password.',
    },
  });
});

// ── 9. Non-Production RBAC Ping Verification Routes ──
if (env.NODE_ENV !== 'production') {
  authRouter.get('/_ping/customer', requireAuth, requireRole('customer'), (req, res) => {
    res.status(200).json({ data: { ok: true, role: 'customer' } });
  });

  authRouter.get('/_ping/farmer', requireAuth, requireRole('farmer'), (req, res) => {
    res.status(200).json({ data: { ok: true, role: 'farmer' } });
  });

  authRouter.get('/_ping/admin', requireAuth, requireRole('admin'), (req, res) => {
    res.status(200).json({ data: { ok: true, role: 'admin' } });
  });
}
