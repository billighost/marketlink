const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  p.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('PAGE LOG ERROR [' + p.url() + ']:', msg.text());
    }
  });
  p.on('pageerror', err => console.log('PAGE ERROR [' + p.url() + ']:', err.stack || err.message));

  // 1. Customer Context
  console.log('--- Testing as customer (george@example.com) ---');
  const ctxBuyer = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pBuyer = await ctxBuyer.newPage();
  pBuyer.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('BUYER LOG ERROR [' + pBuyer.url() + ']:', msg.text());
    }
  });
  pBuyer.on('pageerror', err => console.log('BUYER PAGE ERROR [' + pBuyer.url() + ']:', err.stack || err.message));

  await pBuyer.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });
  await pBuyer.waitForSelector('input[name="email"]');
  await pBuyer.fill('input[name="email"]', 'george@example.com');
  await pBuyer.fill('input[name="password"]', 'market123');
  await pBuyer.click('button[type="submit"]');
  await pBuyer.waitForTimeout(1500);

  const buyerRoutes = [
    '/buyer',
    '/buyer/smart-basket',
    '/buyer/basket',
    '/buyer/checkout',
    '/buyer/stalls',
    '/buyer/products',
    '/buyer/orders',
    '/buyer/profile'
  ];

  for (const r of buyerRoutes) {
    await pBuyer.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await pBuyer.waitForTimeout(800);
    const text = await pBuyer.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON BUYER ROUTE:', r);
    } else {
      console.log('✓ OK buyer route:', r);
    }
  }
  await ctxBuyer.close();

  // 2. Vendor Context
  console.log('\n--- Testing as vendor (riverbend@example.com) ---');
  const ctxVendor = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pVendor = await ctxVendor.newPage();
  pVendor.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('VENDOR LOG ERROR [' + pVendor.url() + ']:', msg.text());
    }
  });
  pVendor.on('pageerror', err => console.log('VENDOR PAGE ERROR [' + pVendor.url() + ']:', err.stack || err.message));

  await pVendor.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });
  await pVendor.waitForSelector('input[name="email"]');
  await pVendor.fill('input[name="email"]', 'riverbend@example.com');
  await pVendor.fill('input[name="password"]', 'market123');
  await pVendor.click('button[type="submit"]');
  await pVendor.waitForTimeout(1500);

  const vendorRoutes = [
    '/vendor',
    '/vendor/stall',
    '/vendor/orders',
    '/vendor/stock',
    '/vendor/insights',
    '/vendor/reviews'
  ];

  for (const r of vendorRoutes) {
    await pVendor.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await pVendor.waitForTimeout(1000);
    const text = await pVendor.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON VENDOR ROUTE:', r);
    } else {
      console.log('✓ OK vendor route:', r);
    }
  }
  await ctxVendor.close();

  await b.close();
})();
