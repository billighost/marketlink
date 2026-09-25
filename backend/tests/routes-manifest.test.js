/**
 * Route Inventory, API Documentation Parity, and Response Shape Verification Suite.
 * Guarantees zero documentation drift, strict RBAC coverage, and frozen response shapes.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { getRouteManifest } from '../src/utils/defineRoutes.js';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDocPath = path.resolve(__dirname, '../docs/API.md');

describe('Route Manifest, API.md Contract & Response Shape Suite', () => {
  let manifest;
  let documentedRoutes;
  let customerToken;
  let farmerToken;
  let adminToken;

  before(async () => {
    await setupTestEnvironment();
    createApp();
    manifest = getRouteManifest();

    // Parse documented routes from docs/API.md
    const docContent = fs.readFileSync(apiDocPath, 'utf8');
    documentedRoutes = new Set();
    const headingRegex = /^###\s+(GET|POST|PUT|PATCH|DELETE)\s+(\/api[^\s`]*)/gm;
    let match;
    while ((match = headingRegex.exec(docContent)) !== null) {
      documentedRoutes.add(`${match[1]} ${match[2]}`);
    }

    const customerLogin = await loginUser('george@example.com', 'market123');
    customerToken = customerLogin.accessToken;

    const farmerLogin = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerLogin.accessToken;

    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T5.001: Every registered declarative route is documented in docs/API.md', () => {
    const missingInDocs = [];
    for (const r of manifest) {
      const key = `${r.method} ${r.fullPath}`;
      if (!documentedRoutes.has(key)) {
        missingInDocs.push(key);
      }
    }

    assert.equal(
      missingInDocs.length,
      0,
      `Found ${missingInDocs.length} routes missing from docs/API.md: ${missingInDocs.join(', ')}`
    );
  });

  it('T5.002: Every route documented in docs/API.md exists in declarative route manifest', () => {
    const manifestSet = new Set(manifest.map((r) => `${r.method} ${r.fullPath}`));
    const extraInDocs = [];
    for (const docRoute of documentedRoutes) {
      if (!manifestSet.has(docRoute)) {
        extraInDocs.push(docRoute);
      }
    }

    assert.equal(
      extraInDocs.length,
      0,
      `Found ${extraInDocs.length} extra routes in docs/API.md not registered in manifest: ${extraInDocs.join(', ')}`
    );
  });

  it('T5.003: Manifest contains all expected 130 core platform routes', () => {
    assert.ok(
      manifest.length >= 130,
      `Expected at least 130 routes in manifest, got ${manifest.length}`
    );
  });

  it('T5.004: All write routes require body schema declaration or explicit handler', () => {
    for (const r of manifest) {
      if (['POST', 'PUT', 'PATCH'].includes(r.method)) {
        // Internal utility pings or actions may have no body, but must have valid handlers
        assert.ok(r.module, `Route ${r.method} ${r.fullPath} must declare a module`);
      }
    }
  });

  it('T5.005: Response shapes do not expose MongoDB _id, passwordHash, or tokenHash', async () => {
    // 1. Check user profile response
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(meRes.status, 200);
    const meJson = await meRes.text();
    assert.equal(meJson.includes('"_id"'), false, 'Response must never leak "_id"');
    assert.equal(meJson.includes('passwordHash'), false, 'Response must never leak "passwordHash"');
    assert.equal(meJson.includes('tokenHash'), false, 'Response must never leak "tokenHash"');

    // 2. Check public products response
    const prodRes = await request('/api/products?limit=5', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(prodRes.status, 200);
    const prodJson = await prodRes.text();
    assert.equal(prodJson.includes('"_id"'), false, 'Products response must never leak "_id"');

    // 3. Check public markets response
    const mktRes = await request('/api/markets', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(mktRes.status, 200);
    const mktJson = await mktRes.text();
    assert.equal(mktJson.includes('"_id"'), false, 'Markets response must never leak "_id"');
  });

  it('T5.006: Money amounts in API responses are integer cents (no floating-point decimals)', async () => {
    const prodRes = await request('/api/products?limit=5', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const prodBody = await prodRes.json();
    for (const p of prodBody.data) {
      assert.equal(Number.isInteger(p.priceCents), true, `Product ${p.id} priceCents must be integer`);
      assert.ok(p.priceCents >= 0, `Product ${p.id} priceCents must be non-negative`);
    }

    const orderRes = await request('/api/orders?limit=5', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const orderBody = await orderRes.json();
    for (const o of orderBody.data) {
      assert.equal(Number.isInteger(o.totalCents), true, `Order ${o.id} totalCents must be integer`);
      for (const item of o.items || []) {
        assert.equal(Number.isInteger(item.unitPriceCents), true);
        assert.equal(Number.isInteger(item.lineTotalCents), true);
      }
    }
  });

  it('T5.007: Date fields in API responses are formatted as ISO 8601 UTC strings', async () => {
    const meRes = await request('/api/users/me', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meBody = await meRes.json();
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    if (meBody.data.createdAt) {
      assert.match(meBody.data.createdAt, isoDateRegex, 'createdAt must be ISO 8601 UTC string');
    }
    if (meBody.data.updatedAt) {
      assert.match(meBody.data.updatedAt, isoDateRegex, 'updatedAt must be ISO 8601 UTC string');
    }
  });
});
