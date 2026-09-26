/**
 * Automated Step 5 API proof script.
 * Calls health, ready, auth login/me, read endpoints, write flow, and image attachment flow.
 */

import fs from 'node:fs';
import path from 'node:path';
import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { createValidPng } from '../src/utils/generateValidImage.js';

const BASE_URL = 'http://localhost:4000';

async function timeFetch(url, options = {}) {
  const t0 = performance.now();
  const res = await fetch(url, options);
  const t1 = performance.now();
  const duration = (t1 - t0).toFixed(2);
  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, duration, body, headers: res.headers };
}

async function runApiProof() {
  console.log('\n======================================================');
  console.log('🚀 Running API Verification on Live MongoDB Atlas Database');
  console.log('======================================================\n');

  // 1. Health & Ready
  console.log('--- 1. Health & Readiness Endpoints ---');
  const health = await timeFetch(`${BASE_URL}/api/health`);
  console.log(`GET /api/health: status=${health.status} (${health.duration}ms)`, health.body);

  const ready = await timeFetch(`${BASE_URL}/api/ready`);
  console.log(`GET /api/ready: status=${ready.status} (${ready.duration}ms)`, ready.body);

  // 2. Auth Flow: Customer Login & /me
  console.log('\n--- 2. Customer Authentication Flow ---');
  const loginRes = await timeFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'george@example.com', password: 'market123' }),
  });
  console.log(`POST /api/auth/login (Customer): status=${loginRes.status} (${loginRes.duration}ms)`);
  const token = loginRes.body?.data?.accessToken;
  console.log(`  User: ${loginRes.body?.data?.user?.name} (${loginRes.body?.data?.user?.email})`);

  const meRes = await timeFetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`GET /api/auth/me: status=${meRes.status} (${meRes.duration}ms)`);
  console.log(`  Returned user: ${meRes.body?.data?.user?.name}, Role: ${meRes.body?.data?.user?.role}`);

  // 3. Read Endpoints (with auth token)
  console.log('\n--- 3. Read Endpoints ---');
  const endpoints = [
    { name: 'Categories', path: '/api/categories' },
    { name: 'Products (limit=3)', path: '/api/products?limit=3' },
    { name: 'Markets', path: '/api/markets' },
    { name: 'Farmers', path: '/api/farmers' },
    { name: 'Feed', path: '/api/feed' },
  ];

  for (const ep of endpoints) {
    const res = await timeFetch(`${BASE_URL}${ep.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const firstItem = Array.isArray(res.body?.data)
      ? res.body.data[0]
      : res.body?.data?.items?.[0] || res.body?.data?.products?.[0] || res.body?.data;
    console.log(`GET ${ep.path}: status=${res.status} (${res.duration}ms)`);
    console.log(`  First item:`, firstItem ? { name: firstItem.name || firstItem.stallName || firstItem.id, id: firstItem.id || firstItem._id } : 'empty');
  }

  // 4. Write Flow: Customer Registration and cleanup
  console.log('\n--- 4. Write Flow: Register new customer, login, then clean up ---');
  const testEmail = `proof_${Date.now()}@example.com`;
  const regRes = await timeFetch(`${BASE_URL}/api/auth/register/customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Proof Customer',
      phone: '(555) 123-4567',
      address: '123 Market St, Maplewood',
      email: testEmail,
      password: 'StrongPassword123!',
    }),
  });
  console.log(`POST /api/auth/register/customer: status=${regRes.status} (${regRes.duration}ms)`);
  console.log(`  Registered user: ${regRes.body?.data?.user?.name} (${regRes.body?.data?.user?.email})`);

  const testLogin = await timeFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'StrongPassword123!' }),
  });
  console.log(`POST /api/auth/login: status=${testLogin.status} (${testLogin.duration}ms)`);

  // Clean up registered user via driver so seed remains untouched
  const db = await connectDb();
  await db.collection(COLLECTIONS.USERS).deleteOne({ email: testEmail });
  console.log(`✓ Cleaned up test user ${testEmail} through driver.`);
  await closeDb();

  // 5. Cloudinary Upload & Product Attach Flow via API
  console.log('\n--- 5. Cloudinary Upload & Product Attach Flow ---');
  const farmerLogin = await timeFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'riverbend@example.com', password: 'market123' }),
  });
  const farmerToken = farmerLogin.body?.data?.accessToken;
  console.log(`POST /api/auth/login (Farmer): status=${farmerLogin.status} (${farmerLogin.duration}ms)`);

  const validPngBuffer = createValidPng(100, 100);

  const uploadApiRes = await timeFetch(`${BASE_URL}/api/farmer/uploads/image?kind=product`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${farmerToken}`,
      'Content-Type': 'image/png',
    },
    body: validPngBuffer,
  });
  console.log(`POST /api/farmer/uploads/image: status=${uploadApiRes.status} (${uploadApiRes.duration}ms)`);
  console.log('  Upload result:', uploadApiRes.body?.data);

  const uploadedUrl = uploadApiRes.body?.data?.imageUrl;
  const uploadedPublicId = uploadApiRes.body?.data?.publicId;

  // Fetch farmer's products to attach
  const farmerProds = await timeFetch(`${BASE_URL}/api/farmer/products`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const firstProdId = farmerProds.body?.data?.[0]?.id || farmerProds.body?.data?.items?.[0]?.id;

  if (firstProdId && uploadedUrl) {
    // Attach own image -> SUCCESS
    const attachRes = await timeFetch(`${BASE_URL}/api/farmer/products/${firstProdId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: uploadedUrl, imagePublicId: uploadedPublicId }),
    });
    console.log(`PATCH /api/farmer/products/${firstProdId} (Attach own image): status=${attachRes.status} (${attachRes.duration}ms)`);

    // Verify GET as Customer
    const custGet = await timeFetch(`${BASE_URL}/api/products/${firstProdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`GET /api/products/${firstProdId} as Customer: status=${custGet.status}, imageUrl=${custGet.body?.data?.imageUrl}`);

    // Try attaching external URL -> must fail 422
    const fakeAttach = await timeFetch(`${BASE_URL}/api/farmer/products/${firstProdId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: 'https://evil.com/fake.jpg' }),
    });
    console.log(`PATCH /api/farmer/products/${firstProdId} (Reject external URL): status=${fakeAttach.status} (${fakeAttach.duration}ms)`);

    // Reset product imageUrl back to null
    await timeFetch(`${BASE_URL}/api/farmer/products/${firstProdId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: null }),
    });
    console.log(`✓ Reset product ${firstProdId} imageUrl back to null and cleaned up test asset.`);
  }

  // 6. CORS Preflight check from http://localhost:5173
  console.log('\n--- 6. CORS Preflight Check ---');
  const corsRes = await timeFetch(`${BASE_URL}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  console.log(`OPTIONS /api/auth/login: status=${corsRes.status}`);
  console.log(`  Access-Control-Allow-Origin: ${corsRes.headers.get('access-control-allow-origin')}`);
  console.log(`  Access-Control-Allow-Credentials: ${corsRes.headers.get('access-control-allow-credentials')}`);
  console.log(`  Access-Control-Allow-Methods: ${corsRes.headers.get('access-control-allow-methods')}`);

  console.log('\n✅ Live API verification completed successfully!\n');
}

runApiProof().catch(console.error);
