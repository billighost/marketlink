const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Guest detail pages and interactions
  console.log('=== TESTING GUEST PAGES & INTERACTIONS ===');
  const ctxGuest = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pGuest = await ctxGuest.newPage();
  pGuest.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('GUEST LOG ERROR [' + pGuest.url() + ']:', msg.text());
    }
  });
  pGuest.on('pageerror', err => console.log('GUEST PAGE ERROR [' + pGuest.url() + ']:', err.stack || err.message));

  const guestRoutes = [
    '/',
    '/markets/6ab8c2604b80703aafbb4315',
    '/farmers/6ab8c2614b80703aafbb4324',
    '/products/6ab8c2614b80703aafbb433f',
    '/about',
    '/contact'
  ];

  for (const r of guestRoutes) {
    await pGuest.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await pGuest.waitForTimeout(1000);
    const text = await pGuest.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON GUEST ROUTE:', r);
    } else {
      console.log('✓ OK guest route:', r);
    }
  }

  // Click floating Smart Basket button on guest home
  console.log('Testing guest clicking floating Smart Basket...');
  await pGuest.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await pGuest.waitForTimeout(800);
  const sbBtn = await pGuest.$('[title="Open Smart Basket"]');
  if (sbBtn) {
    await sbBtn.click();
    await pGuest.waitForTimeout(1000);
    const text = await pGuest.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH WHEN GUEST CLICKS SMART BASKET!');
    } else {
      console.log('✓ OK guest clicked smart basket');
    }
  }
  await ctxGuest.close();

  // 2. Buyer detail pages and interactions
  console.log('\n=== TESTING BUYER PAGES & INTERACTIONS ===');
  const ctxBuyer = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pBuyer = await ctxBuyer.newPage();
  pBuyer.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('BUYER LOG ERROR [' + pBuyer.url() + ']:', msg.text());
    }
  });
  pBuyer.on('pageerror', err => console.log('BUYER PAGE ERROR [' + pBuyer.url() + ']:', err.stack || err.message));

  await pBuyer.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });
  await pBuyer.fill('input[name="email"]', 'george@example.com');
  await pBuyer.fill('input[name="password"]', 'market123');
  await pBuyer.click('button[type="submit"]');
  await pBuyer.waitForTimeout(1500);

  const buyerDetailRoutes = [
    '/buyer/markets/6ab8c2604b80703aafbb4315',
    '/buyer/stalls/6ab8c2614b80703aafbb4324',
    '/buyer/products/6ab8c2614b80703aafbb433f',
    '/buyer/orders/6ab8c2664b80703aafbb436d',
    '/buyer/smart-basket'
  ];

  for (const r of buyerDetailRoutes) {
    await pBuyer.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await pBuyer.waitForTimeout(1200);
    const text = await pBuyer.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON BUYER ROUTE:', r);
    } else {
      console.log('✓ OK buyer route:', r);
    }
  }

  // Click floating Smart Basket button in buyer home
  console.log('Testing buyer opening Smart Basket Modal...');
  await pBuyer.goto('http://127.0.0.1:3000/buyer', { waitUntil: 'domcontentloaded' });
  await pBuyer.waitForTimeout(800);
  const buyerSbBtn = await pBuyer.$('[title="Open Smart Basket"]');
  if (buyerSbBtn) {
    await buyerSbBtn.click();
    await pBuyer.waitForTimeout(1200);
    const text = await pBuyer.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH WHEN BUYER CLICKS SMART BASKET MODAL!');
    } else {
      console.log('✓ OK buyer opened smart basket modal');
    }
  }
  await ctxBuyer.close();

  // 3. Vendor detail pages and interactions
  console.log('\n=== TESTING VENDOR PAGES & INTERACTIONS ===');
  const ctxVendor = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pVendor = await ctxVendor.newPage();
  pVendor.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ErrorBoundary') || msg.text().includes('Uncaught') || msg.text().includes('Error')) {
      console.log('VENDOR LOG ERROR [' + pVendor.url() + ']:', msg.text());
    }
  });
  pVendor.on('pageerror', err => console.log('VENDOR PAGE ERROR [' + pVendor.url() + ']:', err.stack || err.message));

  await pVendor.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });
  await pVendor.fill('input[name="email"]', 'riverbend@example.com');
  await pVendor.fill('input[name="password"]', 'market123');
  await pVendor.click('button[type="submit"]');
  await pVendor.waitForTimeout(1500);

  const vendorDetailRoutes = [
    '/vendor/orders/6ab8c2664b80703aafbb436d',
    '/vendor/stall'
  ];

  for (const r of vendorDetailRoutes) {
    await pVendor.goto('http://127.0.0.1:3000' + r, { waitUntil: 'domcontentloaded' });
    await pVendor.waitForTimeout(1200);
    const text = await pVendor.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON VENDOR ROUTE:', r);
    } else {
      console.log('✓ OK vendor route:', r);
    }
  }

  // On MyStall, test clicking buttons
  console.log('Testing MyStall interactions...');
  await pVendor.goto('http://127.0.0.1:3000/vendor/stall', { waitUntil: 'domcontentloaded' });
  await pVendor.waitForTimeout(1000);
  const toggleBtn = await pVendor.$('button:has-text("Pause Taking Orders"), button:has-text("Resume Taking Orders")');
  if (toggleBtn) {
    await toggleBtn.click();
    await pVendor.waitForTimeout(1000);
    const text = await pVendor.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON VENDOR TOGGLE ORDER INTAKE!');
    } else {
      console.log('✓ OK vendor toggled order intake');
    }
  }

  const wizardBtn = await pVendor.$('button:has-text("Setup Wizard"), button:has-text("Create My Stall")');
  if (wizardBtn) {
    await wizardBtn.click();
    await pVendor.waitForTimeout(1000);
    const text = await pVendor.evaluate(() => document.body.innerText);
    if (text.includes('Something broke on our side')) {
      console.log('💥 CRASH ON VENDOR OPEN WIZARD!');
    } else {
      console.log('✓ OK vendor opened wizard');
    }
  }

  await ctxVendor.close();
  await b.close();
})();
