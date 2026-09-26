/**
 * Unit and integration tests for Gmail SMTP mailer.
 * Tests connection pooling abstractions, transient retries, error code classification,
 * plain-text extraction, credential masking, and daily quota guard.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers.js';
import {
  mailer,
  sendMail,
  maskEmail,
  maskSecret,
  setTransporter,
  resetMailerState,
} from '../src/utils/mailer.js';
import { htmlToPlainText } from '../src/templates/email/layout.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Mailer Module Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    resetMailerState();
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    resetMailerState();
    mailer.history = [];
    if (db) {
      await db.collection(COLLECTIONS.EMAIL_LOG).deleteMany({ to: { $regex: /example\.com$/ } });
    }
  });

  // ── 1. Masking & Utility Helpers ──
  describe('Masking and Text Sanitization', () => {
    it('masks email addresses properly for logging', () => {
      assert.equal(maskEmail('george@example.com'), 'g***@example.com');
      assert.equal(maskEmail('a@b.com'), 'a***@b.com');
      assert.equal(maskEmail('invalid-string'), '***');
      assert.equal(maskEmail(null), '***');
    });

    it('masks secrets displaying only trailing 4 characters', () => {
      assert.equal(maskSecret('gjztkjtnhmadzere'), '****zere');
      assert.equal(maskSecret('abcd'), '****');
      assert.equal(maskSecret('123'), '****');
      assert.equal(maskSecret(null), '****');
    });

    it('converts HTML email markup into clean plain text fallback', () => {
      const html = '<h1>Welcome to MarketLink</h1><p>Visit <a href="https://example.com">MarketLink</a> today!</p>';
      const text = htmlToPlainText(html);
      assert.ok(text.includes('Welcome to MarketLink'));
      assert.ok(text.includes('MarketLink (https://example.com)'));
      assert.ok(!text.includes('<h1>'));
      assert.ok(!text.includes('<p>'));
    });
  });

  // ── 2. Mock Transporter & Delivery Logging ──
  describe('Transporter Sending & emailLog Tracking', () => {
    it('dispatches email through transporter and records in emailLog collection', async () => {
      let sentPayload = null;
      setTransporter({
        sendMail: async (opts) => {
          sentPayload = opts;
          return { messageId: '<mock-msg-1@marketlink>' };
        },
      });

      const recipient = `recipient.${Date.now()}@example.com`;
      const result = await sendMail({
        to: recipient,
        subject: 'Order Ready for Pickup',
        html: '<p>Your basket is packed!</p>',
        tag: 'order-ready',
      });

      assert.equal(result.ok, true);
      assert.equal(result.messageId, '<mock-msg-1@marketlink>');
      assert.equal(sentPayload.to, recipient);
      assert.equal(sentPayload.subject, 'Order Ready for Pickup');
      assert.ok(sentPayload.text.includes('Your basket is packed!'));

      // Verify emailLog entry in MongoDB
      const logEntry = await db.collection(COLLECTIONS.EMAIL_LOG).findOne({ to: recipient });
      assert.ok(logEntry);
      assert.equal(logEntry.status, 'sent');
      assert.equal(logEntry.tag, 'order-ready');
      assert.equal(logEntry.error, null);
    });

    it('retries once on transient SMTP errors (e.g. 421) and succeeds', async () => {
      let attempts = 0;
      setTransporter({
        sendMail: async () => {
          attempts++;
          if (attempts === 1) {
            const err = new Error('421 Service not available, closing transmission channel');
            err.responseCode = 421;
            throw err;
          }
          return { messageId: '<mock-retry-success@marketlink>' };
        },
      });

      const recipient = `transient.${Date.now()}@example.com`;
      const result = await sendMail({
        to: recipient,
        subject: 'Transient Test',
        html: '<p>Testing retry</p>',
        tag: 'test',
        retry: true,
      });

      assert.equal(attempts, 2, 'Should have retried once');
      assert.equal(result.ok, true);
      assert.equal(result.messageId, '<mock-retry-success@marketlink>');
    });

    it('records failed attempt in emailLog and classifies auth error', async () => {
      setTransporter({
        sendMail: async () => {
          const err = new Error('Invalid login: 535-5.7.8 Username and Password not accepted');
          err.responseCode = 535;
          throw err;
        },
      });

      const recipient = `authfail.${Date.now()}@example.com`;
      await assert.rejects(async () => {
        await sendMail({
          to: recipient,
          subject: 'Auth Failure Test',
          html: '<p>Testing auth failure</p>',
          tag: 'test',
          retry: false,
        });
      });

      const logEntry = await db.collection(COLLECTIONS.EMAIL_LOG).findOne({ to: recipient });
      assert.ok(logEntry);
      assert.equal(logEntry.status, 'failed');
      assert.ok(logEntry.error.includes('535'));
    });
  });

  // ── 3. Quota Guard ──
  describe('Daily Quota Guard', () => {
    it('skips non-critical emails when rolling 24h count reaches limit', async () => {
      const now = new Date();
      // Insert 455 fake 'sent' logs in the past 2 hours
      const bulkDocs = [];
      for (let i = 0; i < 455; i++) {
        bulkDocs.push({
          to: `quota.filler.${i}@example.com`,
          tag: 'order-update',
          status: 'sent',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60),
        });
      }
      await db.collection(COLLECTIONS.EMAIL_LOG).insertMany(bulkDocs);

      let sendMailCalled = false;
      setTransporter({
        sendMail: async () => {
          sendMailCalled = true;
          return { messageId: '<should-not-be-called@marketlink>' };
        },
      });

      // Try sending a non-critical restock alert
      const nonCriticalResult = await sendMail({
        to: 'buyer@example.com',
        subject: 'Restock Alert',
        html: '<p>Peaches are back!</p>',
        tag: 'restock-alert',
      });

      assert.equal(nonCriticalResult.skipped, true);
      assert.equal(nonCriticalResult.reason, 'QUOTA_GUARD');
      assert.equal(sendMailCalled, false, 'Transporter should not be called for non-critical email');

      // Now verify that critical emails (e.g. verify-email) still pass through up to 495
      const criticalResult = await sendMail({
        to: 'newuser@example.com',
        subject: 'Confirm Your Email Address',
        html: '<p>Click here to verify</p>',
        tag: 'verify-email',
      });

      assert.equal(criticalResult.ok, true);
      assert.equal(sendMailCalled, true, 'Transporter should be called for critical verify-email');
    });
  });
});
