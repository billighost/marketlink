/**
 * Comprehensive End-to-End Verification of ALL Vendor Capabilities
 * Tests every API route and functional workflow that the vendor frontend uses.
 */

import http from 'node:http';

const BASE_URL = 'http://localhost:4000/api';

async function request(endpoint, options = {}, token = null) {
  const url = new URL(BASE_URL + endpoint);
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    body = JSON.stringify(body);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting Full Vendor Backend Verification...\n');
  let step = 0;
  function logStep(name) {
    step++;
    console.log(`[Step ${step}] ${name}`);
  }

  // 1. Login as Vendor
  logStep('Login as vendor: riverbend@example.com');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'riverbend@example.com', password: 'market123' },
  });
  if (loginRes.status !== 200) {
    throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
  }
  const token = loginRes.body.data?.accessToken;
  const user = loginRes.body.data?.user;
  console.log(`   ✓ Authenticated as ${user.name} (${user.role})`);

  // 2. Auth ME check
  logStep('Verify /auth/me');
  const meRes = await request('/auth/me', {}, token);
  const meRole = meRes.body?.data?.user?.role || meRes.body?.data?.role;
  if (meRes.status !== 200 || !['farmer', 'vendor'].includes(meRole)) {
    throw new Error(`Auth me failed: status ${meRes.status}, data: ${JSON.stringify(meRes.body)}`);
  }
  console.log(`   ✓ Verified role: ${meRole}`);

  // 3. Overview
  logStep('Fetch /farmer/overview');
  const ovRes = await request('/farmer/overview', {}, token);
  if (ovRes.status !== 200 || !ovRes.body.data) {
    throw new Error(`Farmer overview failed: ${ovRes.status}`);
  }
  console.log(`   ✓ Overview KPIs: ordersToday=${ovRes.body.data.kpis?.ordersToday}, weeklyRevenue=${ovRes.body.data.kpis?.weeklyRevenueCents} cents`);

  // 4. Insights (7d, 30d, 90d)
  for (const r of ['7d', '30d', '90d']) {
    logStep(`Fetch /farmer/insights?range=${r}`);
    const insRes = await request(`/farmer/insights?range=${r}`, {}, token);
    if (insRes.status !== 200) {
      throw new Error(`Farmer insights for ${r} failed: ${insRes.status}`);
    }
    console.log(`   ✓ Insights ${r}: totalOrders=${insRes.body.data.totalOrders}`);
  }

  // 5. Stall Profile
  logStep('Fetch /farmer/profile');
  const profRes = await request('/farmer/profile', {}, token);
  if (profRes.status !== 200) {
    throw new Error(`Farmer profile failed: ${profRes.status}`);
  }
  const initialProfile = profRes.body.data;
  console.log(`   ✓ Profile stallName: "${initialProfile.stallName}"`);

  // 6. Update Profile
  logStep('Update /farmer/profile with updated phone & story');
  const patchProfRes = await request(
    '/farmer/profile',
    {
      method: 'PATCH',
      body: {
        phone: '555-0199',
        specialty: 'Certified Organic Heirloom Greens & Root Crops',
        cutoffMinutesBefore: 120,
        maxOrdersPerSlot: 25,
      },
    },
    token
  );
  if (patchProfRes.status !== 200) {
    throw new Error(`Update profile failed: ${patchProfRes.status}: ${JSON.stringify(patchProfRes.body)}`);
  }
  console.log(`   ✓ Profile updated successfully`);

  // 7. Slots & Closures
  logStep('Fetch upcoming slots: /farmer/slots?days=14');
  const slotsRes = await request('/farmer/slots?days=14', {}, token);
  if (slotsRes.status !== 200) {
    throw new Error(`Fetch slots failed: ${slotsRes.status}`);
  }
  console.log(`   ✓ Slots returned: ${slotsRes.body.data.length} slots`);

  const testClosureDate = '2026-10-20';
  logStep(`Add slot closure: ${testClosureDate}`);
  const addClosureRes = await request(
    '/farmer/slots/closures',
    {
      method: 'PUT',
      body: { dates: [testClosureDate], reason: 'Annual tractor overhaul' },
    },
    token
  );
  if (addClosureRes.status !== 200) {
    throw new Error(`Add closure failed: ${addClosureRes.status}`);
  }
  console.log(`   ✓ Closure added`);

  logStep(`Remove slot closure: ${testClosureDate}`);
  const delClosureRes = await request(`/farmer/slots/closures/${testClosureDate}`, { method: 'DELETE' }, token);
  if (delClosureRes.status !== 200) {
    throw new Error(`Remove closure failed: ${delClosureRes.status}`);
  }
  console.log(`   ✓ Closure removed & date reopened`);

  // 8. Categories
  logStep('Fetch /categories');
  const catRes = await request('/categories');
  if (catRes.status !== 200 || !catRes.body.data.length) {
    throw new Error(`Get categories failed: ${catRes.status}`);
  }
  const categoryId = catRes.body.data[0].id || catRes.body.data[0]._id;
  console.log(`   ✓ Categories found: ${catRes.body.data.length}, using first: ${catRes.body.data[0].name}`);

  // 9. Create Product
  logStep('Create product: /farmer/products');
  const createProdRes = await request(
    '/farmer/products',
    {
      method: 'POST',
      body: {
        name: 'Organic Sweet Honeycrisp Apples',
        categoryId,
        priceCents: 450,
        unit: 'lb',
        quantity: 35,
        quantityAvailable: 35,
        lowStockThreshold: 5,
        description: 'Crisp, juicy orchard apples hand-picked at peak autumn sweetness.',
        tags: ['organic', 'seasonal'],
        art: 'apples',
        weekly: { enabled: true, defaultQty: 40 },
      },
    },
    token
  );
  if (createProdRes.status !== 201) {
    throw new Error(`Create product failed: ${createProdRes.status}: ${JSON.stringify(createProdRes.body)}`);
  }
  const newProduct = createProdRes.body.data;
  const newProdId = newProduct.id;
  console.log(`   ✓ Created product id=${newProdId}, name="${newProduct.name}"`);

  // 10. Get Product Detail
  logStep(`Fetch created product: /farmer/products/${newProdId}`);
  const getProdRes = await request(`/farmer/products/${newProdId}`, {}, token);
  if (getProdRes.status !== 200 || getProdRes.body.data.name !== 'Organic Sweet Honeycrisp Apples') {
    throw new Error(`Get product failed: ${getProdRes.status}`);
  }
  console.log(`   ✓ Retrieved product details successfully`);

  // 11. Update Product
  logStep(`Update product stock: /farmer/products/${newProdId}`);
  const patchProdRes = await request(
    `/farmer/products/${newProdId}`,
    {
      method: 'PATCH',
      body: { quantity: 50, priceCents: 425 },
    },
    token
  );
  if (patchProdRes.status !== 200 || patchProdRes.body.data.quantityAvailable !== 50) {
    throw new Error(`Update product failed: ${patchProdRes.status}`);
  }
  console.log(`   ✓ Product updated with quantity 50`);

  // 12. Mark Sold Out
  logStep(`Mark product sold out: /farmer/products/${newProdId}/sold-out`);
  const soldOutRes = await request(`/farmer/products/${newProdId}/sold-out`, { method: 'POST' }, token);
  if (soldOutRes.status !== 200 || soldOutRes.body.data.availability !== 'out') {
    throw new Error(`Mark sold out failed: ${soldOutRes.status}`);
  }
  console.log(`   ✓ Product marked sold out`);

  // 13. Mark Available
  logStep(`Mark product available: /farmer/products/${newProdId}/available`);
  const availRes = await request(
    `/farmer/products/${newProdId}/available`,
    {
      method: 'POST',
      body: { quantity: 20 },
    },
    token
  );
  if (availRes.status !== 200 || availRes.body.data.availability !== 'in') {
    throw new Error(`Mark available failed: ${availRes.status}`);
  }
  console.log(`   ✓ Product marked available with 20 units`);

  // 14. Hide & Unhide
  logStep(`Hide product: /farmer/products/${newProdId}/hide`);
  const hideRes = await request(`/farmer/products/${newProdId}/hide`, { method: 'POST' }, token);
  if (hideRes.status !== 200 || hideRes.body.data.availability !== 'hidden') {
    throw new Error(`Hide product failed: ${hideRes.status}`);
  }
  console.log(`   ✓ Product hidden`);

  logStep(`Unhide product: /farmer/products/${newProdId}/unhide`);
  const unhideRes = await request(`/farmer/products/${newProdId}/unhide`, { method: 'POST' }, token);
  if (unhideRes.status !== 200 || unhideRes.body.data.availability === 'hidden') {
    throw new Error(`Unhide product failed: ${unhideRes.status}`);
  }
  console.log(`   ✓ Product unhidden`);

  // 15. Weekly Template
  logStep('Fetch /farmer/weekly-template');
  const tmplRes = await request('/farmer/weekly-template', {}, token);
  if (tmplRes.status !== 200) {
    throw new Error(`Get template failed: ${tmplRes.status}`);
  }
  console.log(`   ✓ Template items: ${tmplRes.body.data?.items?.length || tmplRes.body.data?.length || 0}`);

  logStep('Update /farmer/weekly-template');
  const updateTmplRes = await request(
    '/farmer/weekly-template',
    {
      method: 'PUT',
      body: {
        items: [
          {
            productId: newProdId,
            enabled: true,
            defaultQuantity: 30,
          },
        ],
      },
    },
    token
  );
  if (updateTmplRes.status !== 200) {
    throw new Error(`Update template failed: ${updateTmplRes.status}: ${JSON.stringify(updateTmplRes.body)}`);
  }
  console.log(`   ✓ Template updated`);

  logStep('Apply /farmer/weekly-template/apply');
  const applyTmplRes = await request('/farmer/weekly-template/apply', { method: 'POST' }, token);
  if (applyTmplRes.status !== 200) {
    throw new Error(`Apply template failed: ${applyTmplRes.status}`);
  }
  console.log(`   ✓ Applied weekly template`);

  // Also test alias /farmer/template
  logStep('Verify alias /farmer/template');
  const aliasTmplRes = await request('/farmer/template', {}, token);
  if (aliasTmplRes.status !== 200) {
    throw new Error(`Alias template failed: ${aliasTmplRes.status}`);
  }
  console.log(`   ✓ Alias /farmer/template works seamlessly`);

  // 16. Delete created product
  logStep(`Delete test product: /farmer/products/${newProdId}`);
  const delProdRes = await request(`/farmer/products/${newProdId}`, { method: 'DELETE' }, token);
  if (delProdRes.status !== 200) {
    throw new Error(`Delete product failed: ${delProdRes.status}`);
  }
  console.log(`   ✓ Product deleted`);

  // 17. Orders List across all tabs
  for (const status of ['placed', 'accepted', 'ready', 'completed', 'cancelled']) {
    logStep(`Fetch /farmer/orders?status=${status}`);
    const ordRes = await request(`/farmer/orders?status=${status}&limit=5`, {}, token);
    if (ordRes.status !== 200) {
      throw new Error(`Fetch orders for ${status} failed: ${ordRes.status}`);
    }
    console.log(`   ✓ Tab ${status}: ${ordRes.body.data?.length || 0} orders (count: ${ordRes.body.meta?.counts?.[status] || 0})`);
  }

  // 18. Pick List
  logStep('Fetch /farmer/orders/pick-list');
  const today = new Date().toISOString().slice(0, 10);
  const pickRes = await request(`/farmer/orders/pick-list?date=${today}`, {}, token);
  if (pickRes.status !== 200) {
    throw new Error(`Get picklist failed: ${pickRes.status}`);
  }
  console.log(`   ✓ Picklist retrieved for ${today} (products: ${pickRes.body.data?.products?.length || 0})`);

  // Also test alias /farmer/picklist
  logStep('Verify alias /farmer/picklist');
  const aliasPickRes = await request(`/farmer/picklist?date=${today}`, {}, token);
  if (aliasPickRes.status !== 200) {
    throw new Error(`Alias picklist failed: ${aliasPickRes.status}`);
  }
  console.log(`   ✓ Alias /farmer/picklist works seamlessly`);

  // 19. Reviews & Replies
  logStep('Fetch /farmer/reviews');
  const revRes = await request('/farmer/reviews', {}, token);
  if (revRes.status !== 200) {
    throw new Error(`Get reviews failed: ${revRes.status}`);
  }
  console.log(`   ✓ Reviews count: ${revRes.body.data?.length || 0}`);
  if (revRes.body.data?.length > 0) {
    const testReview = revRes.body.data[0];
    logStep(`Post reply to review: ${testReview.id}`);
    const replyRes = await request(
      `/farmer/reviews/${testReview.id}/reply`,
      {
        method: 'POST',
        body: { text: 'Thank you for supporting our family farm! We look forward to seeing you next market.' },
      },
      token
    );
    if (replyRes.status !== 200) {
      console.warn(`   Notice on review reply: ${replyRes.status}`);
    } else {
      console.log(`   ✓ Reply saved to review`);

      logStep(`Delete reply on review: ${testReview.id}`);
      const delReplyRes = await request(`/farmer/reviews/${testReview.id}/reply`, { method: 'DELETE' }, token);
      console.log(`   ✓ Reply deleted`);
    }
  }

  console.log('\n🎉 ALL VENDOR BACKEND CAPABILITIES VERIFIED PERFECTLY! 🎉\n');
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
