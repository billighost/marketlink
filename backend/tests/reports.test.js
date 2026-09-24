/**
 * Admin Reports and CSV Export Test Suite (T4.251 - T4.275)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Admin Reports and CSV Export Suite (T4.251 - T4.275)', () => {
  let db;
  let adminToken = '';

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;
  });

  it('T4.251: GET /api/admin/reports/summary matches independent plain JS calculation over orders', async () => {
    const res = await request('/api/admin/reports/summary?range=30d', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    // Independent calculation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await db
      .collection(COLLECTIONS.ORDERS)
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .toArray();

    const expectedTotal = orders.length;
    const completed = orders.filter((o) => o.status === 'completed');
    const expectedRevenue = completed.reduce((sum, o) => sum + (o.totalCents || 0), 0);

    assert.equal(data.totalOrders, expectedTotal);
    assert.equal(data.revenueCents, expectedRevenue);
    assert.ok(Array.isArray(data.revenueByMarket));
    assert.ok(Array.isArray(data.mostActiveFarmers));
    assert.ok(Array.isArray(data.ordersByDay));
    assert.ok(Array.isArray(data.topProducts));
    assert.ok(Array.isArray(data.newMembers));
  });

  it('T4.252: Range exceeding 366 days returns 422 RANGE_TOO_LARGE', async () => {
    const res = await request('/api/admin/reports/summary?range=400d', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error?.code, 'RANGE_TOO_LARGE');

    const csvRes = await request('/api/admin/reports/export?range=400d', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(csvRes.status, 422);
  });

  it('T4.253: CSV export includes headers, BOM, formula-injection defense, and audit logging', async () => {
    // Insert order with special characters to test formula injection defense and quoting
    const injectedOrder = {
      orderNumber: 'TEST-CSV-FORMULA',
      customerName: '=cmd|’ /C calc’!A0', // formula injection string
      farmerName: 'Farm with "Quotes", and commas',
      status: 'placed',
      totalCents: 4500,
      createdAt: new Date(),
    };
    await db.collection(COLLECTIONS.ORDERS).insertOne(injectedOrder);

    const res = await request('/api/admin/reports/export?type=orders&range=30d', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);

    // Verify response headers
    assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
    assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename='));

    const text = await res.text();

    // 1. Verify UTF-8 BOM is the very first character
    assert.equal(text.charCodeAt(0), 0xfeff, 'CSV must start with UTF-8 BOM');

    // 2. Verify header row
    assert.ok(text.includes('orderNumber,createdAt,status,customerName,farmerName,market,pickupStart,itemCount,totalUSD'));

    // 3. Verify formula injection is escaped by prepending single quote
    assert.ok(text.includes("''=cmd|’ /C calc’!A0") || text.includes("'=cmd|’ /C calc’!A0"));

    // 4. Verify quotes and commas are double-quoted
    assert.ok(text.includes('"Farm with ""Quotes"", and commas"'));

    // 5. Verify report history entry recorded
    const reportDoc = await db.collection(COLLECTIONS.REPORTS).findOne({
      reportType: 'orders',
    });
    assert.ok(reportDoc, 'Report history record must be created');

    // 6. Verify audit log entry
    const audit = await db.collection(COLLECTIONS.AUDIT_LOG).findOne({
      action: 'report.export',
    });
    assert.ok(audit, 'Audit log entry must be created');
  });
});
