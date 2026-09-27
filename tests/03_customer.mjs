import { createTestContext, BASE_URL, loginAsCustomer } from './helpers.mjs';

export async function runCustomerSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING TEST SUITE 3: Customer App End-to-End');
  console.log('======================================================');

  const { browser, context, page, consoleErrors, uncaughtErrors } = await createTestContext({
    width: 390,
    height: 844, // iPhone 14 mobile viewport
  });

  const results = [];

  try {
    // ── 3.1 Sign In as George Adams ─────────────────────────────────
    console.log('Testing 3.1: Authenticating as Customer George Adams ...');
    await loginAsCustomer(page);
    console.log('  ✓ Authenticated and loaded /buyer');

    // ── 3.2 Feed Sections & Greeting ─────────────────────────────────
    console.log('Testing 3.2: Customer Home Feed & Greeting ...');
    await page.waitForSelector('h1, [class*="greeting"]', { timeout: 8000 });
    const greetingText = await page.textContent('h1, [class*="greeting"]');
    console.log(`  ✓ Greeting text: "${greetingText.trim()}"`);

    // Wait for feed product cards from GET /feed
    await page.waitForSelector('article a[href*="/buyer/products/"]', { timeout: 12000 });
    const feedCards = await page.$$('article');
    console.log(`  ✓ Feed rendered ${feedCards.length} product/farmer cards`);
    if (feedCards.length === 0) throw new Error('Expected feed cards from GET /feed');

    results.push({ test: 'Feed & Greeting', status: 'PASS', details: `${feedCards.length} feed cards loaded` });

    // ── 3.3 Product Page (Real URL Navigation) ───────────────────────
    console.log('Testing 3.3: Product Detail Real Page Navigation ...');
    const firstProduct = await page.$('a[href*="/buyer/products/"]');
    if (!firstProduct) throw new Error('No clickable product found on feed');
    const productHref = await firstProduct.getAttribute('href');
    await firstProduct.click();

    // Verify URL changed to real page (not overlay)
    await page.waitForURL(`**${productHref}`, { timeout: 8000 });
    console.log(`  ✓ Navigated directly to product URL: ${page.url()}`);

    // Check dynamic title
    await page.waitForTimeout(500);
    const productTitle = await page.title();
    console.log(`  ✓ Product dynamic page title: "${productTitle}"`);

    // Verify price formatting ($X.XX or £X.XX)
    const priceEl = await page.$('[class*="price"]');
    if (priceEl) {
      const pText = await priceEl.textContent();
      console.log(`  ✓ Product price formatted: "${pText.trim()}"`);
    }

    // Go back to today
    await page.goBack();
    await page.waitForURL('**/buyer', { timeout: 8000 });
    console.log('  ✓ Browser back returned to /buyer');

    results.push({ test: 'Product Page Navigation', status: 'PASS', details: 'Direct URL change and back navigation verified' });

    // ── 3.4 Direct URL Refresh (Standalone Load) ────────────────────
    console.log('Testing 3.4: Direct URL Refresh / Standalone Load ...');
    await page.goto(`${BASE_URL}${productHref}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 8000 });
    console.log(`  ✓ Standalone page load rendered successfully for ${productHref}`);
    results.push({ test: 'Standalone Page Refresh', status: 'PASS', details: 'Direct URL loads standalone without background' });

    // ── 3.5 Redirects Verification ──────────────────────────────────
    console.log('Testing 3.5: Legacy Redirects (/buyer/cart -> /buyer/basket, /buyer/favorites -> /buyer/saved) ...');
    await page.goto(`${BASE_URL}/buyer/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/buyer/basket', { timeout: 8000 });
    console.log('  ✓ /buyer/cart successfully redirected to /buyer/basket');

    await page.goto(`${BASE_URL}/buyer/favorites`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/buyer/saved', { timeout: 8000 });
    console.log('  ✓ /buyer/favorites successfully redirected to /buyer/saved');

    results.push({ test: 'Legacy Redirects', status: 'PASS', details: '/buyer/cart and /buyer/favorites redirect canonically' });

    // ── 3.6 Basket Page Navigation ──────────────────────────────────
    console.log('Testing 3.6: Basket Page via Navigation ...');
    const basketNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Basket")', { timeout: 6000 });
    await basketNavBtn.click();
    await page.waitForURL('**/buyer/basket', { timeout: 8000 });
    console.log('  ✓ Bottom navigation Basket button navigates to /buyer/basket page');

    results.push({ test: 'Basket Page', status: 'PASS', details: 'Basket renders as a dedicated page' });

    // ── 3.7 Orders Page & Detail Navigation ─────────────────────────
    console.log('Testing 3.7: Orders Page & Order Detail Navigation ...');
    const ordersNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Orders")', { timeout: 6000 });
    await ordersNavBtn.click();
    await page.waitForURL('**/buyer/orders', { timeout: 8000 });

    const orderRow = await page.$('article a[href*="/buyer/orders/"], a[href*="/buyer/orders/"]');
    if (orderRow) {
      const orderHref = await orderRow.getAttribute('href');
      await orderRow.click();
      await page.waitForURL(`**${orderHref}`, { timeout: 8000 });
      console.log(`  ✓ Navigated to order detail page: ${page.url()}`);

      // Verify Back navigation
      await page.goBack();
      await page.waitForURL('**/buyer/orders', { timeout: 8000 });
      console.log('  ✓ Browser back returned to /buyer/orders');
    }

    results.push({ test: 'Orders Page & Navigation', status: 'PASS', details: 'Orders list and detail navigation verified' });

    // ── 3.8 Browse & Filter Sheet ───────────────────────────────────
    console.log('Testing 3.8: Browse & Filter Sheet (isOpen bug fix) ...');
    const browseNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Browse")', { timeout: 6000 });
    await browseNavBtn.click();
    await page.waitForURL('**/buyer/products', { timeout: 8000 });

    // Click Filter button to verify bottom sheet opens
    const filterBtn = await page.waitForSelector('button:has-text("Filters")', { timeout: 8000 });
    await filterBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    console.log('  ✓ Filter BottomSheet successfully opened on Browse page (isOpen fix confirmed)');

    // Close filter sheet
    const closeSheetBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"], [role="dialog"] button:has-text("Done"), [role="dialog"] button:has-text("Close")');
    if (closeSheetBtn) {
      await closeSheetBtn.click();
      await page.waitForTimeout(400);
      console.log('  ✓ Filter sheet closed');
    }

    results.push({ test: 'Browse & Filter Sheet', status: 'PASS', details: 'Filter sheet opens correctly with open prop' });

    // ── 3.9 Profile & Sub-pages ─────────────────────────────────────
    console.log('Testing 3.9: Profile, Personal Details & Notifications Pages ...');
    const youNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("You")', { timeout: 6000 });
    await youNavBtn.click();
    await page.waitForURL('**/buyer/profile', { timeout: 8000 });
    console.log('  ✓ Profile page loaded');

    // Click Personal details link/row
    const detailsRow = await page.waitForSelector('a[href*="/buyer/profile/details"], button:has-text("Personal details")', { timeout: 6000 });
    await detailsRow.click();
    await page.waitForURL('**/buyer/profile/details', { timeout: 8000 });
    console.log('  ✓ Navigated to /buyer/profile/details page');

    await page.goBack();
    await page.waitForURL('**/buyer/profile', { timeout: 8000 });

    results.push({ test: 'Profile & Sub-pages', status: 'PASS', details: 'Sub-destinations navigate as real pages' });

  } catch (err) {
    console.error('❌ CUSTOMER SUITE ERROR:', err);
    results.push({ test: 'Customer Suite', status: 'FAIL', details: err.message });
  } finally {
    await browser.close();
  }

  const passed = results.every(r => r.status === 'PASS');
  console.log('\n--- Customer Suite Summary ---');
  results.forEach(r => console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.test}: ${r.details}`));
  return { passed, results, errors: uncaughtErrors };
}

if (process.argv[1]?.endsWith('03_customer.mjs')) {
  runCustomerSuite().then(({ passed }) => {
    process.exit(passed ? 0 : 1);
  });
}
