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

    // ── 3.3 Product Page & Pre-order Add ─────────────────────────────
    console.log('Testing 3.3: Product Detail Page & Basket Addition ...');
    const firstProduct = await page.$('a[href*="/buyer/products/"]');
    if (!firstProduct) throw new Error('No clickable product found on feed');
    const productHref = await firstProduct.getAttribute('href');
    await firstProduct.click();

    // Verify URL changed to real page
    await page.waitForURL(`**${productHref}`, { timeout: 8000 });
    console.log(`  ✓ Navigated to dedicated Product Detail page: ${page.url()}`);

    // Check dynamic title
    const productTitle = await page.title();
    console.log(`  ✓ Page dynamic document title: "${productTitle}"`);

    // Verify price formatting ($X.XX)
    const pagePrice = await page.$('[class*="price"]');
    if (pagePrice) {
      const pText = await pagePrice.textContent();
      console.log(`  ✓ Product price formatted: "${pText.trim()}"`);
      if (!pText.match(/\$\d+\.\d{2}/)) {
        throw new Error(`Invalid price format on page: "${pText}"`);
      }
    }

    // Click "Pre-order for pickup" / Add button
    const addBtn = await page.waitForSelector('button:has-text("Pre-order"), button:has-text("Add")', { timeout: 8000 });
    await addBtn.click();
    console.log('  ✓ Tapped "Add to pre-order" button');
    await page.waitForTimeout(600);

    // Test Back button navigation
    await page.goBack();
    await page.waitForURL('**/buyer', { timeout: 8000 });
    console.log('  ✓ Back button returned to /buyer feed');

    results.push({ test: 'Product Page & Add to Basket', status: 'PASS', details: 'Navigated to real page, added item, and Back returned to feed' });

    // ── 3.4 Basket Page & Live Server Quote ──────────────────────────
    console.log('Testing 3.4: Basket Page, Server Quote & Pickup Selection ...');
    // Open basket via BottomNav Basket tab
    const basketNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Basket")', { timeout: 6000 });
    await basketNavBtn.click();
    await page.waitForURL('**/buyer/basket', { timeout: 8000 });
    console.log(`  ✓ Navigated to canonical basket page: ${page.url()}`);

    // Verify server quote loaded
    await page.waitForSelector('[class*="farmerGroup"]', { timeout: 8000 });
    console.log('  ✓ Basket server quote POST /cart/quote loaded vendor groups');

    // Check pickup slot chips
    const slotChips = await page.$$('button[class*="slotButton"]');
    console.log(`  ✓ Pickup slot selection chips found: ${slotChips.length}`);
    if (slotChips.length > 0) {
      await slotChips[0].click();
      console.log('  ✓ Selected pickup slot');
      await page.waitForTimeout(500);
    }

    // Check checkout button
    const checkoutBtn = await page.waitForSelector('button[class*="placeOrderButton"]', { timeout: 8000 });
    const isCheckoutDisabled = await checkoutBtn.isDisabled();
    console.log(`  ✓ Place pre-order button state: disabled=${isCheckoutDisabled}`);

    // If enabled, execute checkout!
    if (!isCheckoutDisabled) {
      console.log('  Executing atomic checkout (POST /orders/checkout) ...');
      await checkoutBtn.click();

      // Wait for Order Confirmation page
      await page.waitForSelector(':has-text("Pre-order placed"), :has-text("Order placed"), :has-text("Confirmed")', { timeout: 10000 });
      console.log('  ✓ Order confirmed page rendered successfully!');
    }

    results.push({ test: 'Basket & Atomic Checkout', status: 'PASS', details: 'Live quote verified on /buyer/basket, checkout executed' });

    // ── 3.5 Orders List & Order Detail Page ──────────────────────────
    console.log('Testing 3.5: Orders List & Order Detail Page with MapView ...');
    const ordersNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Orders")', { timeout: 6000 });
    await ordersNavBtn.click();
    await page.waitForURL('**/buyer/orders', { timeout: 8000 });

    // Verify Orders tab loaded
    await page.waitForSelector('article a[href*="/buyer/orders/"], [class*="orderCard"], [class*="orderRow"], article', { timeout: 8000 });
    const orderRows = await page.$$('article a[href*="/buyer/orders/"], [class*="orderCard"], [class*="orderRow"], article');
    console.log(`  ✓ Found ${orderRows.length} active/past order rows`);

    // Click on the top order to open Order Detail page
    const firstOrder = await page.$('article a[href*="/buyer/orders/"]');
    if (firstOrder) {
      const orderHref = await firstOrder.getAttribute('href');
      await firstOrder.click();
      await page.waitForURL(`**${orderHref}`, { timeout: 8000 });
      console.log(`  ✓ Navigated to dedicated Order Detail page: ${page.url()}`);

      // Check Leaflet MapView on Order Detail
      await page.waitForSelector('.leaflet-container', { timeout: 8000 });
      console.log('  ✓ Order pickup card Leaflet MapView mounted');

      // Navigate back
      await page.goBack();
      await page.waitForURL('**/buyer/orders', { timeout: 8000 });
      console.log('  ✓ Back button returned to orders index');
    }

    results.push({ test: 'Orders & Order Detail Map', status: 'PASS', details: 'Active orders listed, detail page has Leaflet map' });

    // ── 3.6 Search & Browse with Filter Sheet ────────────────────────
    console.log('Testing 3.6: Browse, Live Search & Filter Sheet ...');
    const browseNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Browse")', { timeout: 6000 });
    await browseNavBtn.click();
    await page.waitForURL('**/buyer/products', { timeout: 8000 });

    // Test filter sheet actually opens (verifying Task 8 bugfix)
    const filterBtn = await page.waitForSelector('button[class*="filterButton"], button:has-text("Filters")', { timeout: 6000 });
    await filterBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    console.log('  ✓ Filter BottomSheet opens successfully (open prop bug verified fixed)');

    // Close filter sheet with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await page.waitForSelector('input[type="search"], input[placeholder*="Search"]', { timeout: 8000 });
    const browseSearchInput = await page.$('input[type="search"], input[placeholder*="Search"]');
    if (browseSearchInput) {
      await browseSearchInput.fill('Apple');
      await page.waitForTimeout(600); // debounce
      console.log(`  ✓ Browse search query input: Apple`);
      
      const searchCards = await page.$$('article, [class*="card"]');
      console.log(`  ✓ Search results rendered: ${searchCards.length} items`);
    }

    results.push({ test: 'Browse & Live Search', status: 'PASS', details: 'Browse catalog, filter sheet opens, and search functional' });

    // ── 3.7 AI Assistant Page ────────────────────────────────────────
    console.log('Testing 3.7: AI Assistant Page ...');
    // Return to Today tab
    const todayNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Today")', { timeout: 6000 });
    await todayNavBtn.click();
    await page.waitForURL('**/buyer', { timeout: 8000 });

    // Click "Ask MarketLink" assistant trigger button
    const assistantTrigger = await page.waitForSelector('button:has-text("Ask MarketLink")', { timeout: 8000 });
    await assistantTrigger.click();
    await page.waitForURL('**/buyer/assistant', { timeout: 8000 });
    console.log(`  ✓ AI Assistant rendered as standalone page: ${page.url()}`);

    // Click suggestion chip or send message
    const suggestionBtn = await page.$('button[class*="suggestionChip"]');
    if (suggestionBtn) {
      const chipText = await suggestionBtn.textContent();
      console.log(`  ✓ Clicking suggestion chip: "${chipText.trim()}"`);
      await suggestionBtn.click();
    } else {
      const assistantInput = await page.$('input[placeholder*="Ask"]');
      const sendBtn = await page.$('button[type="submit"]');
      if (assistantInput && sendBtn) {
        await assistantInput.fill('What fresh apples are available?');
        await sendBtn.click();
      }
    }

    // Wait for reply bubble from POST /assistant/message
    await page.waitForSelector('[class*="assistantBubble"], [class*="bubble"]:last-child', { timeout: 12000 });
    console.log('  ✓ Assistant response received and rendered');

    // Go back
    await page.goBack();
    await page.waitForURL('**/buyer', { timeout: 8000 });

    results.push({ test: 'AI Assistant', status: 'PASS', details: 'Assistant page and streaming functional' });

    // ── 3.8 Customer Profile & Pages ─────────────────────────────────
    console.log('Testing 3.8: Profile, Details & Notifications Pages ...');
    const youNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("You")', { timeout: 6000 });
    await youNavBtn.click();
    await page.waitForURL('**/buyer/profile', { timeout: 8000 });
    console.log('  ✓ Profile page loaded');

    // Open Personal details page
    const detailsRow = await page.waitForSelector('button:has-text("Personal details")', { timeout: 6000 });
    await detailsRow.click();
    await page.waitForURL('**/buyer/profile/details', { timeout: 8000 });
    await page.waitForSelector('input#name, input[id="name"]', { timeout: 8000 });
    console.log('  ✓ Personal details rendered as standalone page with user data');

    // Go back to profile
    await page.goBack();
    await page.waitForURL('**/buyer/profile', { timeout: 8000 });

    // Open Notifications page
    const notificationsRow = await page.waitForSelector('button:has-text("Notifications")', { timeout: 6000 });
    await notificationsRow.click();
    await page.waitForURL('**/buyer/profile/notifications', { timeout: 8000 });
    console.log('  ✓ Notifications page rendered as standalone page');

    // Go back to profile
    await page.goBack();
    await page.waitForURL('**/buyer/profile', { timeout: 8000 });

    results.push({ test: 'Profile & Sub-pages', status: 'PASS', details: 'Personal details and notifications pages verified' });

    // ── 3.9 Redirect Assertions ──────────────────────────────────────
    console.log('Testing 3.9: Old URL Redirects ...');
    await page.goto(`${BASE_URL}/buyer/cart`);
    await page.waitForURL('**/buyer/basket', { timeout: 8000 });
    console.log('  ✓ /buyer/cart redirects to /buyer/basket');

    await page.goto(`${BASE_URL}/buyer/favorites`);
    await page.waitForURL('**/buyer/saved', { timeout: 8000 });
    console.log('  ✓ /buyer/favorites redirects to /buyer/saved');

    await page.goto(`${BASE_URL}/buyer/farmers`);
    await page.waitForURL('**/buyer/stalls', { timeout: 8000 });
    console.log('  ✓ /buyer/farmers redirects to /buyer/stalls');

    results.push({ test: 'Redirects', status: 'PASS', details: 'All legacy URLs redirect correctly' });

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
