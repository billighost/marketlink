<<<<<<< HEAD
import { Router } from 'express';import bcrypt from 'bcryptjs';import { env } from '../../config/env.js';import { AppError } from '../../utils/errors.js';import { toApi } from '../../utils/ids.js';import { generateRandomToken, signAccessToken } from '../../utils/tokens.js';import { mailer } from '../../utils/mailer.js';import {  rejectUnknownFields,  validateString,  validateEmail,  validatePassword,  assertValid,} from '../../utils/validate.js';import { defineRoutes } from '../../utils/defineRoutes.js';import {  findUserByEmail,  findUserById,  findFarmerByUserId,  registerCustomer,  registerFarmer,  updateLastLogin,  recordFailedLogin,  createSession,  findSessionByToken,  rotateSession,  revokeSessionByToken,  revokeAllUserSessions,  createPasswordResetToken,  findValidPasswordReset,  completePasswordReset,} from './auth.service.js';export const authRouter = Router();const REFRESH_COOKIE_OPTIONS = {  httpOnly: true,  secure: env.isProduction,  sameSite: 'lax',  path: '/api/auth',  maxAge: 30 * 24 * 60 * 60 * 1000, };const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuv';const routes = [  {    method: 'post',    path: '/register/customer',    auth: 'public',    limiter: 'register',    summary: 'Registers a new Customer account',    body: 'registerCustomer',    handler: async (req, res) => {      const allowed = ['name', 'phone', 'email', 'address', 'password'];      rejectUnknownFields(req.body, allowed);      const details = [];      const name = validateString(req.body.name, 'name', details, { required: true, min: 2, max: 100 });      const phone = validateString(req.body.phone, 'phone', details, { required: true, min: 7, max: 30 });      const email = validateEmail(req.body.email, 'email', details, true);      const address = validateString(req.body.address, 'address', details, { required: true, min: 3, max: 255 });      const password = validatePassword(req.body.password, 'password', details, true);      assertValid(details);      const existing = await findUserByEmail(email);      if (existing) {        throw AppError.conflict(          'An account with this email address already exists. Please sign in instead.',          'EMAIL_TAKEN'        );      }      const passwordHash = await bcrypt.hash(password, 10);      const user = await registerCustomer({        name,        phone,        email,        address,        passwordHash,      });      const rawRefreshToken = generateRandomToken(48);      await createSession({        userId: user._id,        rawToken: rawRefreshToken,        userAgent: req.headers['user-agent'],        ip: req.ip,      });      const accessToken = signAccessToken({        sub: user._id.toString(),        role: user.role,      });      res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);      res.status(201).json({        data: {          user: toApi(user),          accessToken,        },      });    },  },  {    method: 'post',    path: '/register/farmer',    auth: 'public',    limiter: 'register',    summary: 'Registers a new Farmer account with initial pending status',    body: 'registerFarmer',    handler: async (req, res) => {      const allowed = ['stallName', 'contactPerson', 'phone', 'email', 'address', 'password'];      rejectUnknownFields(req.body, allowed);      const details = [];      const stallName = validateString(req.body.stallName, 'stallName', details, { required: true, min: 2, max: 120 });      const contactPerson = validateString(req.body.contactPerson, 'contactPerson', details, { required: true, min: 2, max: 100 });      const phone = validateString(req.body.phone, 'phone', details, { required: true, min: 7, max: 30 });      const email = validateEmail(req.body.email, 'email', details, true);      const address = validateString(req.body.address, 'address', details, { required: true, min: 3, max: 255 });      const password = validatePassword(req.body.password, 'password', details, true);      assertValid(details);      const existing = await findUserByEmail(email);      if (existing) {        throw AppError.conflict(          'An account with this email address already exists. Please sign in instead.',          'EMAIL_TAKEN'        );      }      const passwordHash = await bcrypt.hash(password, 10);      const { user } = await registerFarmer({        stallName,        contactPerson,        phone,        email,        address,        passwordHash,      });      const rawRefreshToken = generateRandomToken(48);      await createSession({        userId: user._id,        rawToken: rawRefreshToken,        userAgent: req.headers['user-agent'],        ip: req.ip,      });      const accessToken = signAccessToken({        sub: user._id.toString(),        role: user.role,      });      res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);      res.status(201).json({        data: {          user: toApi(user),          accessToken,        },      });    },  },  {    method: 'post',    path: '/login',    auth: 'public',    limiter: 'login',    summary: 'Signs in an existing user with credential verification and account lockout',    body: 'login',    handler: async (req, res) => {      const allowed = ['email', 'password'];      rejectUnknownFields(req.body, allowed);      const details = [];      const email = validateEmail(req.body.email, 'email', details, true);      const password = validateString(req.body.password, 'password', details, { required: true, min: 1, max: 128 });      assertValid(details);      const user = await findUserByEmail(email);      if (!user) {        await bcrypt.compare(password, DUMMY_HASH);        throw AppError.invalidCredentials();      }      const isLockExpired = user.lockUntil && new Date(user.lockUntil) <= new Date();      const effectiveFailedCount = isLockExpired ? 0 : (user.failedLogins || 0);      if (user.lockUntil && !isLockExpired) {        await bcrypt.compare(password, DUMMY_HASH);        throw new AppError(          'Account is temporarily locked due to too many failed sign-in attempts. Please try again in 15 minutes.',          429,          'TOO_MANY_ATTEMPTS'        );      }      const isValidPassword = await bcrypt.compare(password, user.passwordHash);      if (!isValidPassword) {        const { failedLogins } = await recordFailedLogin(user._id, effectiveFailedCount);        if (failedLogins >= 5) {          throw new AppError(            'Account is temporarily locked due to too many failed sign-in attempts. Please try again in 15 minutes.',            429,            'TOO_MANY_ATTEMPTS'          );        }        throw AppError.invalidCredentials();      }      if (user.role === 'customer' && user.status === 'inactive') {        throw AppError.accountInactive();      }      if (user.role === 'farmer' && (user.status === 'suspended' || user.status === 'rejected')) {        throw AppError.accountSuspended();      }      await updateLastLogin(user._id);      const rawRefreshToken = generateRandomToken(48);      await createSession({        userId: user._id,        rawToken: rawRefreshToken,        userAgent: req.headers['user-agent'],        ip: req.ip,      });      const accessToken = signAccessToken({        sub: user._id.toString(),        role: user.role,      });      res.cookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS);      res.status(200).json({        data: {          user: toApi(user),          accessToken,        },      });    },  },  {    method: 'post',    path: '/refresh',    auth: 'public',    limiter: 'default',    summary: 'Rotates refresh token and issues a new access token',    handler: async (req, res) => {      const rawRefreshToken = req.cookies?.refreshToken;      if (!rawRefreshToken) {        throw AppError.unauthorized('Refresh token is missing.', 'UNAUTHENTICATED');      }      const session = await findSessionByToken(rawRefreshToken);      if (!session) {        res.clearCookie('refreshToken', { path: '/api/auth' });        throw AppError.unauthorized('Invalid refresh session.', 'UNAUTHENTICATED');      }      if (session.revokedAt || session.replacedBy) {        await revokeAllUserSessions(session.userId);        res.clearCookie('refreshToken', { path: '/api/auth' });        throw AppError.unauthorized(          'Suspicious session reuse detected. All sessions have been terminated. Please sign in again.',          'UNAUTHENTICATED'        );      }      if (new Date(session.expiresAt) < new Date()) {        res.clearCookie('refreshToken', { path: '/api/auth' });        throw AppError.tokenExpired('Refresh session expired. Please sign in again.');      }      const user = await findUserById(session.userId);      if (!user) {        res.clearCookie('refreshToken', { path: '/api/auth' });        throw AppError.unauthorized('User not found.', 'UNAUTHENTICATED');      }      if (user.role === 'customer' && user.status === 'inactive') {        throw AppError.accountInactive();      }      if (user.role === 'farmer' && (user.status === 'suspended' || user.status === 'rejected')) {        throw AppError.accountSuspended();      }      const newRawToken = generateRandomToken(48);      await rotateSession({        oldSession: session,        newRawToken,        userAgent: req.headers['user-agent'],        ip: req.ip,      });      const accessToken = signAccessToken({        sub: user._id.toString(),        role: user.role,      });      res.cookie('refreshToken', newRawToken, REFRESH_COOKIE_OPTIONS);      res.status(200).json({        data: {          accessToken,          user: toApi(user),        },      });    },  },  {    method: 'post',    path: '/logout',    auth: 'public',    limiter: 'default',    summary: 'Terminates the current refresh session and clears cookie',    handler: async (req, res) => {      const rawRefreshToken = req.cookies?.refreshToken;      if (rawRefreshToken) {        await revokeSessionByToken(rawRefreshToken);      }      res.clearCookie('refreshToken', { path: '/api/auth' });      res.status(204).end();    },  },  {    method: 'get',    path: '/me',    auth: 'any',    limiter: 'default',    summary: 'Returns profile data for the currently authenticated session',    handler: async (req, res) => {      const user = await findUserById(req.user.id);      if (!user) {        throw AppError.unauthorized('User account no longer exists.', 'UNAUTHENTICATED');      }      const userObj = { ...user };      if (user.role === 'farmer') {        const farmerProfile = await findFarmerByUserId(user._id);        userObj.farmer = {          stallName: farmerProfile ? farmerProfile.stallName : 'My Stall',          approvalStatus: user.status,        };      }      res.status(200).json({        data: {          user: toApi(userObj),        },      });    },  },  {    method: 'post',    path: '/forgot-password',    auth: 'public',    limiter: 'forgot',    summary: 'Generates password reset token and sends email instructions',    body: 'forgotPassword',    handler: async (req, res) => {      const allowed = ['email'];      rejectUnknownFields(req.body, allowed);      const details = [];      const email = validateEmail(req.body.email, 'email', details, true);      assertValid(details);      const user = await findUserByEmail(email);      if (user) {        const rawResetToken = generateRandomToken(32);        await createPasswordResetToken(user._id, rawResetToken);        const resetLink = `${env.APP_BASE_URL}/reset-password?token=${rawResetToken}`;        await mailer.sendPasswordReset(user.email, resetLink);      }      res.status(200).json({        data: {          message: "If an account with that email exists, we've sent password reset instructions.",        },      });    },  },  {    method: 'post',    path: '/reset-password',    auth: 'public',    limiter: 'default',    summary: 'Resets user password with valid single-use token',    body: 'resetPassword',    handler: async (req, res) => {      const allowed = ['token', 'password'];      rejectUnknownFields(req.body, allowed);      const details = [];      const token = validateString(req.body.token, 'token', details, { required: true, min: 10, max: 128 });      const password = validatePassword(req.body.password, 'password', details, true);      assertValid(details);      const resetRecord = await findValidPasswordReset(token);      if (!resetRecord) {        throw new AppError(422, 'INVALID_RESET_TOKEN', 'Invalid, expired, or already used password reset link.');      }      const newPasswordHash = await bcrypt.hash(password, 10);      await completePasswordReset({        resetDocId: resetRecord._id,        userId: resetRecord.userId,        newPasswordHash,      });      res.status(200).json({        data: {          message: 'Your password has been successfully reset. Please sign in with your new password.',        },      });    },  },];if (env.NODE_ENV !== 'production') {  routes.push(    {      method: 'get',      path: '/_ping/customer',      auth: 'customer',      summary: 'RBAC verification ping for customer role',      handler: (req, res) => {        res.status(200).json({ data: { ok: true, role: 'customer' } });      },    },    {      method: 'get',      path: '/_ping/farmer',      auth: 'farmer',      summary: 'RBAC verification ping for farmer role',      handler: (req, res) => {        res.status(200).json({ data: { ok: true, role: 'farmer' } });      },    },    {      method: 'get',      path: '/_ping/admin',      auth: 'admin',      summary: 'RBAC verification ping for admin role',      handler: (req, res) => {        res.status(200).json({ data: { ok: true, role: 'admin' } });      },    }  );}defineRoutes(authRouter, 'auth', routes, { basePath: '/api/auth' });
=======
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
import { defineRoutes } from '../../utils/defineRoutes.js';
import {
  findUserByEmail,
  findUserById,
  findFarmerByUserId,
  registerCustomer,
  registerFarmer,
  updateLastLogin,
  recordFailedLogin,
  createSession,
  findSessionByToken,
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  createPasswordResetToken,
  findValidPasswordReset,
  completePasswordReset,
  createEmailVerificationToken,
  invalidatePriorVerificationTokens,
  countRecentResendRequests,
  verifyEmailWithToken,
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

const routes = [
  // ── 1. Register Customer ──
  {
    method: 'post',
    path: '/register/customer',
    auth: 'public',
    limiter: 'register',
    summary: 'Registers a new Customer account',
    body: 'registerCustomer',
    handler: async (req, res) => {
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

      // Generate verification token and send branded confirmation email (best-effort)
      const rawVerificationToken = generateRandomToken(32);
      await createEmailVerificationToken(user._id, rawVerificationToken);
      const verifyLink = `${env.APP_BASE_URL}/verify-email?token=${rawVerificationToken}`;

      mailer.sendVerificationEmail(user, verifyLink).catch((err) => {
        console.warn('[REGISTER] Failed to dispatch customer verification email:', err.message);
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
    },
  },

  // ── 2. Register Farmer ──
  {
    method: 'post',
    path: '/register/farmer',
    auth: 'public',
    limiter: 'register',
    summary: 'Registers a new Farmer account with initial pending status',
    body: 'registerFarmer',
    handler: async (req, res) => {
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

      // Generate verification token and send branded confirmation email (best-effort)
      const rawVerificationToken = generateRandomToken(32);
      await createEmailVerificationToken(user._id, rawVerificationToken);
      const verifyLink = `${env.APP_BASE_URL}/verify-email?token=${rawVerificationToken}`;

      mailer.sendVerificationEmail(user, verifyLink).catch((err) => {
        console.warn('[REGISTER] Failed to dispatch farmer verification email:', err.message);
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
    },
  },

  // ── 3. Login with Account Lockout ──
  {
    method: 'post',
    path: '/login',
    auth: 'public',
    limiter: 'login',
    summary: 'Signs in an existing user with credential verification and account lockout',
    body: 'login',
    handler: async (req, res) => {
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

      // Check account lockout
      const isLockExpired = user.lockUntil && new Date(user.lockUntil) <= new Date();
      const effectiveFailedCount = isLockExpired ? 0 : (user.failedLogins || 0);

      if (user.lockUntil && !isLockExpired) {
        // Equalize timing on locked accounts
        await bcrypt.compare(password, DUMMY_HASH);
        throw new AppError(
          'Account is temporarily locked due to too many failed sign-in attempts. Please try again in 15 minutes.',
          429,
          'TOO_MANY_ATTEMPTS'
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        const { failedLogins } = await recordFailedLogin(user._id, effectiveFailedCount);
        if (failedLogins >= 5) {
          throw new AppError(
            'Account is temporarily locked due to too many failed sign-in attempts. Please try again in 15 minutes.',
            429,
            'TOO_MANY_ATTEMPTS'
          );
        }
        throw AppError.invalidCredentials();
      }

      // Account status verification
      if (user.role === 'customer' && user.status === 'inactive') {
        throw AppError.accountInactive();
      }

      if (user.role === 'farmer' && (user.status === 'suspended' || user.status === 'rejected')) {
        throw AppError.accountSuspended();
      }

      // Reset failed logins counter and update login timestamp
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
    },
  },

  // ── 4. Refresh ──
  {
    method: 'post',
    path: '/refresh',
    auth: 'public',
    limiter: 'default',
    summary: 'Rotates refresh token and issues a new access token',
    handler: async (req, res) => {
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
    },
  },

  // ── 5. Logout ──
  {
    method: 'post',
    path: '/logout',
    auth: 'public',
    limiter: 'default',
    summary: 'Terminates the current refresh session and clears cookie',
    handler: async (req, res) => {
      const rawRefreshToken = req.cookies?.refreshToken;
      if (rawRefreshToken) {
        await revokeSessionByToken(rawRefreshToken);
      }
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.status(204).end();
    },
  },

  // ── 6. Current User (GET /auth/me) ──
  {
    method: 'get',
    path: '/me',
    auth: 'any',
    limiter: 'default',
    summary: 'Returns profile data for the currently authenticated session',
    handler: async (req, res) => {
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
    },
  },

  // ── 7. Forgot Password ──
  {
    method: 'post',
    path: '/forgot-password',
    auth: 'public',
    limiter: 'forgot',
    summary: 'Generates password reset token and sends email instructions',
    body: 'forgotPassword',
    handler: async (req, res) => {
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

      // Always return 200 with identical generic message to prevent user enumeration
      res.status(200).json({
        data: {
          message: "If an account with that email exists, we've sent password reset instructions.",
        },
      });
    },
  },

  // ── 8. Reset Password ──
  {
    method: 'post',
    path: '/reset-password',
    auth: 'public',
    limiter: 'default',
    summary: 'Resets user password with valid single-use token',
    body: 'resetPassword',
    handler: async (req, res) => {
      const allowed = ['token', 'password'];
      rejectUnknownFields(req.body, allowed);

      const details = [];
      const token = validateString(req.body.token, 'token', details, { required: true, min: 10, max: 128 });
      const password = validatePassword(req.body.password, 'password', details, true);
      assertValid(details);

      const resetRecord = await findValidPasswordReset(token);
      if (!resetRecord) {
        throw new AppError(422, 'INVALID_RESET_TOKEN', 'Invalid, expired, or already used password reset link.');
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
    },
  },

  // ── 9. Verify Email (POST and GET) ──
  {
    method: 'post',
    path: '/verify-email',
    auth: 'public',
    limiter: 'default',
    summary: 'Verifies email address with single-use token',
    body: 'verifyEmail',
    handler: async (req, res) => {
      const allowed = ['token'];
      rejectUnknownFields(req.body, allowed);

      const details = [];
      const token = validateString(req.body.token, 'token', details, { required: true, min: 10, max: 128 });
      assertValid(details);

      const result = await verifyEmailWithToken(token);
      if (!result.success) {
        throw new AppError(422, 'INVALID_VERIFICATION_TOKEN', 'Invalid, expired, or already used email verification link.');
      }

      res.status(200).json({
        data: {
          message: 'Your email has been verified successfully.',
          user: toApi(result.user),
        },
      });
    },
  },
  {
    method: 'get',
    path: '/verify-email',
    auth: 'public',
    summary: 'Verifies email address via GET token query param',
    handler: async (req, res) => {
      const token = req.query.token;
      if (!token || typeof token !== 'string') {
        throw new AppError(422, 'INVALID_VERIFICATION_TOKEN', 'Verification token is required.');
      }

      const result = await verifyEmailWithToken(token);
      if (!result.success) {
        throw new AppError(422, 'INVALID_VERIFICATION_TOKEN', 'Invalid, expired, or already used email verification link.');
      }

      res.status(200).json({
        data: {
          message: 'Your email has been verified successfully.',
          user: toApi(result.user),
        },
      });
    },
  },

  // ── 10. Resend Verification Email ──
  {
    method: 'post',
    path: '/resend-verification',
    auth: 'public',
    limiter: 'default',
    summary: 'Resends email verification link if unverified (rate-limited)',
    body: 'resendVerification',
    handler: async (req, res) => {
      const allowed = ['email'];
      rejectUnknownFields(req.body, allowed);

      const details = [];
      const email = validateEmail(req.body.email, 'email', details, true);
      assertValid(details);

      const user = await findUserByEmail(email);

      // Only dispatch if user exists and is not yet verified
      if (user && user.emailVerified !== true) {
        const recentAttempts = await countRecentResendRequests(user._id);
        if (recentAttempts >= 3) {
          throw new AppError(
            429,
            'TOO_MANY_REQUESTS',
            'Verification email requests are limited to 3 per hour. Please check your inbox or try again later.'
          );
        }

        // Invalidate prior unused tokens
        await invalidatePriorVerificationTokens(user._id);

        const rawVerificationToken = generateRandomToken(32);
        await createEmailVerificationToken(user._id, rawVerificationToken);
        const verifyLink = `${env.APP_BASE_URL}/verify-email?token=${rawVerificationToken}`;

        await mailer.sendVerificationEmail(user, verifyLink).catch((err) => {
          console.warn('[AUTH] Resend verification email warning:', err.message);
        });
      }

      // Return identical generic success response to prevent email probing
      res.status(200).json({
        data: {
          message: "If an unverified account with that email exists, we've sent a new verification link.",
        },
      });
    },
  },
];

// ── 9. Non-Production RBAC Ping Verification Routes ──
if (env.NODE_ENV !== 'production') {
  routes.push(
    {
      method: 'get',
      path: '/_ping/customer',
      auth: 'customer',
      summary: 'RBAC verification ping for customer role',
      handler: (req, res) => {
        res.status(200).json({ data: { ok: true, role: 'customer' } });
      },
    },
    {
      method: 'get',
      path: '/_ping/farmer',
      auth: 'farmer',
      summary: 'RBAC verification ping for farmer role',
      handler: (req, res) => {
        res.status(200).json({ data: { ok: true, role: 'farmer' } });
      },
    },
    {
      method: 'get',
      path: '/_ping/admin',
      auth: 'admin',
      summary: 'RBAC verification ping for admin role',
      handler: (req, res) => {
        res.status(200).json({ data: { ok: true, role: 'admin' } });
      },
    }
  );
}

defineRoutes(authRouter, 'auth', routes, { basePath: '/api/auth' });
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
