<<<<<<< HEAD
export const mailer = {  async sendPasswordReset(email, resetLink) {    console.log('\n================== [EMAIL STUB: PASSWORD RESET] ==================');    console.log(`To: ${email}`);    console.log(`Subject: Reset your MarketLink password`);    console.log(`Reset link: ${resetLink}`);    console.log('This link expires in 30 minutes.');    console.log('==================================================================\n');  },  async sendOrderConfirmation(email, details = {}) {    mailer.history.push({ type: 'order_confirmation', email, details, at: new Date() });    console.log('\n================== [EMAIL STUB: ORDER CONFIRMATION] ==================');    console.log(`To: ${email}`);    console.log(`Subject: Pre-order placed: ${details.orderNumber || ''}`);    console.log(`Pickup: ${details.pickupLabel || ''}`);    console.log('======================================================================\n');  },  async sendOrderReady(email, details = {}) {    mailer.history.push({ type: 'order_ready', email, details, at: new Date() });    console.log('\n================== [EMAIL STUB: ORDER READY] ==================');    console.log(`To: ${email}`);    console.log(`Subject: Your order ${details.orderNumber || ''} is ready for pickup!`);    console.log(`Stall: ${details.stallNumber || ''}`);    console.log('===============================================================\n');  },  history: [],};
=======
/**
 * Production-ready Gmail SMTP Mailer.
 * Backed by nodemailer with connection pooling, rate limiting, retry semantics,
 * and soft daily-quota protection for Gmail's 500 recipients/day ceiling.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { getDb } from '../db/client.js';
import { COLLECTIONS } from '../db/collections.js';
import { htmlToPlainText } from '../templates/email/layout.js';
import * as templates from '../templates/email/templates.js';

/**
 * Masks email address for safe console logging.
 * e.g. "george@example.com" -> "g***@example.com"
 *
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 0 ? `${name[0]}***` : '***';
  return `${maskedName}@${domain}`;
}

/**
 * Masks password displaying only last 4 characters.
 * e.g. "gjztkjznhmadzere" -> "****zere"
 *
 * @param {string} pass
 * @returns {string}
 */
export function maskSecret(pass) {
  if (!pass || typeof pass !== 'string') return '****';
  const trimmed = pass.trim();
  if (trimmed.length <= 4) return '****';
  return `****${trimmed.slice(-4)}`;
}

// Mailer operational flags
let isMisconfigured = false;
let quotaExceededToday = false;
let activeTransporter = null;

/**
 * Creates the pooled nodemailer Gmail transporter.
 */
export function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 3,        // Respect Gmail concurrency limits (prevents 432)
    maxMessages: 100,         // Recycle connections after 100 sends
    rateDelta: 1000,
    rateLimit: 5,             // Max 5 messages/sec through this pool
    connectionTimeout: 10000, // 10s connection timeout
    socketTimeout: 10000,     // 10s socket timeout
  });
}

/**
 * Creates an in-memory mock transporter for test environments.
 */
export function createMockTransporter(options = {}) {
  const sent = [];
  return {
    isMock: true,
    sent,
    async sendMail(mailOptions) {
      if (options.onSend) {
        await options.onSend(mailOptions);
      }
      const info = {
        messageId: `<mock-${Date.now()}-${Math.random().toString(36).slice(2)}@marketlink>`,
        response: '250 2.0.0 OK: message queued',
        envelope: { from: mailOptions.from, to: [mailOptions.to] },
        accepted: [mailOptions.to],
        rejected: [],
      };
      sent.push({ ...mailOptions, info, at: new Date() });
      return info;
    },
    async verify() {
      if (options.failVerify) {
        throw new Error('535 5.7.8 Username and Password not accepted');
      }
      return true;
    },
  };
}

/**
 * Retrieves or initializes the active nodemailer transporter.
 */
export function getTransporter() {
  if (activeTransporter) return activeTransporter;

  if (env.isTest && !process.env.FORCE_REAL_MAILER) {
    activeTransporter = createMockTransporter();
  } else {
    activeTransporter = createGmailTransporter();
  }
  return activeTransporter;
}

/**
 * Allows test suites to inject a custom or mock transporter.
 *
 * @param {object|null} transporter
 */
export function setTransporter(transporter) {
  activeTransporter = transporter;
}

/**
 * Resets mailer operational flags (useful between tests).
 */
export function resetMailerState() {
  isMisconfigured = false;
  quotaExceededToday = false;
  mailer.history = [];
}

/**
 * Verifies credentials at startup in development.
 */
export async function verifyMailerConnection() {
  if (env.isTest) return true;
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.warn('[MAILER] Notice: GMAIL_USER or GMAIL_APP_PASSWORD not set. SMTP sending is inactive.');
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`[MAILER] Verified Gmail SMTP for ${maskEmail(env.GMAIL_USER)} (pass: ${maskSecret(env.GMAIL_APP_PASSWORD)})`);
    return true;
  } catch (err) {
    isMisconfigured = true;
    console.error(`[MAILER] SMTP Authentication Failed for ${maskEmail(env.GMAIL_USER)} (pass: ${maskSecret(env.GMAIL_APP_PASSWORD)}):`, err.message);
    return false;
  }
}

/**
 * Calculates current rolling 24-hour send count from emailLog.
 *
 * @returns {Promise<number>}
 */
export async function getRollingDailySentCount() {
  try {
    const db = getDb();
    if (!db) return 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await db.collection(COLLECTIONS.EMAIL_LOG).countDocuments({
      createdAt: { $gte: oneDayAgo },
      status: 'sent',
    });
  } catch {
    return 0;
  }
}

/**
 * Logs email dispatch attempt into the emailLog collection.
 * Real email address stored for support purposes; stdout logs are masked.
 */
async function recordEmailLog({ to, tag, status, error = null }) {
  try {
    const db = getDb();
    if (db) {
      await db.collection(COLLECTIONS.EMAIL_LOG).insertOne({
        to,
        tag: tag || 'general',
        status,
        error: error ? (error.message || String(error)) : null,
        createdAt: new Date(),
      });
    }
  } catch (dbErr) {
    console.error('[MAILER] Warning: Failed to record emailLog entry:', dbErr.message);
  }
}

/**
 * Core sendMail function.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML body
 * @param {string} [params.text] - Plain text fallback
 * @param {string} [params.tag='general'] - Email category tag
 * @param {boolean} [params.retry=true] - Whether to retry once on transient errors
 * @returns {Promise<object>}
 */
export async function sendMail({ to, subject, html, text, tag = 'general', retry = true }) {
  if (!to || typeof to !== 'string') {
    throw new Error('[MAILER] Recipient email is required');
  }

  const plainText = text || htmlToPlainText(html);
  const fromAddress = env.EMAIL_FROM || `MarketLink <${env.GMAIL_USER}>`;

  // Maintain in-memory history for legacy assertions & test verification
  mailer.history.push({
    type: tag,
    email: to,
    subject,
    html,
    text: plainText,
    at: new Date(),
  });

  // Fast-fail if credentials are permanently invalid
  if (isMisconfigured) {
    const err = new Error('[MAILER] Mailer is misconfigured with invalid Gmail credentials');
    await recordEmailLog({ to, tag, status: 'failed', error: err });
    throw err;
  }

  // Soft daily-quota guard check
  const isCritical = tag === 'verify-email' || tag === 'password-reset';
  const dailyLimit = env.GMAIL_DAILY_LIMIT || 450;
  const hardStopLimit = 495; // Absolute ceiling below Google's 500

  const sentCountToday = await getRollingDailySentCount();

  if (quotaExceededToday || sentCountToday >= (isCritical ? hardStopLimit : dailyLimit)) {
    if (!isCritical) {
      console.warn(`[MAILER] Quota guard reached (${sentCountToday}/${dailyLimit}). Skipping non-critical email tag='${tag}' to ${maskEmail(to)}.`);
      await recordEmailLog({ to, tag, status: 'skipped_quota', error: 'Daily quota guard reached' });
      return { skipped: true, reason: 'QUOTA_GUARD', sentCount: sentCountToday };
    } else if (sentCountToday >= hardStopLimit) {
      console.error(`[MAILER] Hard daily limit reached (${sentCountToday}/${hardStopLimit}). Cannot send critical email tag='${tag}' to ${maskEmail(to)}.`);
      const hardQuotaErr = new Error('Daily Gmail sending quota reached');
      await recordEmailLog({ to, tag, status: 'failed', error: hardQuotaErr });
      throw hardQuotaErr;
    }
  }

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    text: plainText,
  };

  const transporter = getTransporter();

  // Attempt send with retry-once logic
  try {
    const info = await transporter.sendMail(mailOptions);
    await recordEmailLog({ to, tag, status: 'sent' });
    return { ok: true, messageId: info.messageId, tag };
  } catch (err) {
    const errStr = (err.message || '').toLowerCase();
    const code = (err.responseCode || err.code || '').toString();

    // 1. Bad credentials (534/535) -> Stop retrying
    if (code === '534' || code === '535' || errStr.includes('5.7.8') || errStr.includes('5.7.9')) {
      isMisconfigured = true;
      console.error(`[MAILER] Bad Gmail credentials for ${maskEmail(env.GMAIL_USER)} (pass: ${maskSecret(env.GMAIL_APP_PASSWORD)}). Mailer marked misconfigured.`);
      await recordEmailLog({ to, tag, status: 'failed', error: err });
      throw err;
    }

    // 2. Daily quota exceeded (550-5.4.5)
    if (code === '550' || errStr.includes('5.4.5') || errStr.includes('quota')) {
      quotaExceededToday = true;
      console.error('[MAILER] Gmail 550 daily quota exceeded. Halting non-critical sends.');
      await recordEmailLog({ to, tag, status: 'failed', error: err });
      throw err;
    }

    // 3. Transient error (421, 450, timeout, connection reset) -> Retry once after ~2s
    const isTransient =
      code === '421' ||
      code === '450' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'ESOCKET' ||
      errStr.includes('timeout') ||
      errStr.includes('closed');

    if (retry && isTransient) {
      console.warn(`[MAILER] Transient SMTP error (${code || err.message}). Retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const retryInfo = await transporter.sendMail(mailOptions);
        await recordEmailLog({ to, tag, status: 'sent' });
        return { ok: true, messageId: retryInfo.messageId, tag, retried: true };
      } catch (retryErr) {
        console.error(`[MAILER] Retry failed for ${maskEmail(to)}:`, retryErr.message);
        await recordEmailLog({ to, tag, status: 'failed', error: retryErr });
        throw retryErr;
      }
    }

    // Permanent or unhandled failure
    await recordEmailLog({ to, tag, status: 'failed', error: err });
    throw err;
  }
}

/**
 * Public Mailer API with domain convenience wrappers.
 * Maintains backwards compatibility with all existing call sites.
 */
export const mailer = {
  history: [],

  /**
   * Sends email verification link to newly registered user.
   */
  async sendVerificationEmail(user, link) {
    const email = typeof user === 'string' ? user : user.email;
    const userObj = typeof user === 'string' ? { email, name: email.split('@')[0], role: 'customer' } : user;
    const { subject, html, text } = templates.verifyEmail(userObj, link);
    return sendMail({ to: email, subject, html, text, tag: 'verify-email' });
  },

  /**
   * Sends password reset instructions.
   */
  async sendPasswordReset(email, resetLink) {
    const { subject, html, text } = templates.passwordReset({ email }, resetLink);
    return sendMail({ to: email, subject, html, text, tag: 'password-reset' });
  },

  /**
   * Sends order confirmation email upon pre-order checkout.
   */
  async sendOrderConfirmation(email, details = {}) {
    const { subject, html, text } = templates.orderPlaced({ ...details, details });
    return sendMail({ to: email, subject, html, text, tag: 'order-placed' });
  },

  /**
   * Sends order accepted notification email.
   */
  async sendOrderAccepted(email, details = {}) {
    const { subject, html, text } = templates.orderAccepted({ ...details, details });
    return sendMail({ to: email, subject, html, text, tag: 'order-accepted' });
  },

  /**
   * Sends order ready for pickup notification email.
   */
  async sendOrderReady(email, details = {}) {
    const { subject, html, text } = templates.orderReady({ ...details, details });
    return sendMail({ to: email, subject, html, text, tag: 'order-ready' });
  },

  /**
   * Sends order completed confirmation email.
   */
  async sendOrderCompleted(email, details = {}) {
    const { subject, html, text } = templates.orderCompleted({ ...details, details });
    return sendMail({ to: email, subject, html, text, tag: 'order-completed' });
  },

  /**
   * Sends order declined notification email.
   */
  async sendOrderDeclined(email, details = {}, reason = '') {
    const { subject, html, text } = templates.orderDeclined({ ...details, details }, reason);
    return sendMail({ to: email, subject, html, text, tag: 'order-declined' });
  },

  /**
   * Sends order cancelled notification email.
   */
  async sendOrderCancelled(email, details = {}, who = '') {
    const { subject, html, text } = templates.orderCancelled({ ...details, details }, who);
    return sendMail({ to: email, subject, html, text, tag: 'order-cancelled' });
  },

  /**
   * Sends product restock alert email.
   */
  async sendRestockAlert(email, user, product) {
    const { subject, html, text } = templates.restockAlert(user || { email }, product || {});
    return sendMail({ to: email, subject, html, text, tag: 'restock-alert' });
  },

  /**
   * Sends review reply notification email.
   */
  async sendReviewReply(email, user, farmerName, replyExcerpt) {
    const { subject, html, text } = templates.reviewReply(user || { email }, farmerName, replyExcerpt);
    return sendMail({ to: email, subject, html, text, tag: 'review-reply' });
  },

  /**
   * Sends farmer approval confirmation email.
   */
  async sendFarmerApproved(email, user) {
    const { subject, html, text } = templates.farmerApproved(user || { email });
    return sendMail({ to: email, subject, html, text, tag: 'farmer-approved' });
  },

  /**
   * Sends farmer suspension notice email.
   */
  async sendFarmerSuspended(email, user, reason) {
    const { subject, html, text } = templates.farmerSuspended(user || { email }, reason);
    return sendMail({ to: email, subject, html, text, tag: 'farmer-suspended' });
  },

  /**
   * Sends broadcast announcement email.
   */
  async sendAnnouncement(email, user, announcementData) {
    const { subject, html, text } = templates.announcement(user || { email }, announcementData || {});
    return sendMail({ to: email, subject, html, text, tag: 'announcement' });
  },

  /**
   * Sends contact form receipt acknowledgment email.
   */
  async sendContactAck(email, details = {}) {
    const { subject, html, text } = templates.contactAck(details);
    return sendMail({ to: email, subject, html, text, tag: 'contact-ack' });
  },
};

mailer.sendEmail = sendMail;
export { sendMail as sendEmail };

>>>>>>> bc73418815cde522512fe21a2af884eee3163165
