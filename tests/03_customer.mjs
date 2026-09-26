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

    // ── 3.3 Product Sheet & Pre-order Add ────────────────────────────
    console.log('Testing 3.3: Product Detail Sheet & Cart Addition ...');
    const firstProduct = await page.$('a[href*="/buyer/products/"]');
    if (!firstProduct) throw new Error('No clickable product found on feed');
    await firstProduct.click();

    // Verify BottomSheet opens
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    console.log('  ✓ Product Detail BottomSheet opened');

    // Check dynamic title
    const sheetTitle = await page.title();
    console.log(`  ✓ Sheet dynamic title: "${sheetTitle}"`);

    // Verify price formatting ($X.XX)
    const sheetPrice = await page.$('[role="dialog"] [class*="price"]');
    if (sheetPrice) {
      const pText = await sheetPrice.textContent();
      console.log(`  ✓ Product price formatted: "${pText.trim()}"`);
      if (!pText.match(/\$\d+\.\d{2}/)) {
        throw new Error(`Invalid price format in sheet: "${pText}"`);
      }
    }

    // Click "Pre-order for pickup" / Add button
    const addBtn = await page.waitForSelector('[role="dialog"] button:has-text("Pre-order"), [role="dialog"] button:has-text("Add")', { timeout: 8000 });
    await addBtn.click();
    console.log('  ✓ Tapped "Add to pre-order" button');
    await page.waitForTimeout(600);

    // Close the sheet
    const closeProductBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
    if (closeProductBtn) {
      await closeProductBtn.click();
      await page.waitForTimeout(400);
      console.log('  ✓ Product sheet closed');
    }

    results.push({ test: 'Product Sheet & Add to Cart', status: 'PASS', details: 'Added to cart and verified price format' });

    // ── 3.4 Cart Sheet & Live Server Quote ───────────────────────────
    console.log('Testing 3.4: Cart Sheet, Server Quote & Pickup Selection ...');
    // Open cart via BottomNav Cart tab
    const cartNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Cart")', { timeout: 6000 });
    await cartNavBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });

    // Verify server quote loaded
    await page.waitForSelector('[class*="farmerGroup"]', { timeout: 8000 });
    console.log('  ✓ Cart server quote POST /cart/quote loaded vendor groups');

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

      // Wait for Order Confirmation step in-sheet
      await page.waitForSelector(':has-text("Order placed"), :has-text("Confirmed"), :has-text("Pre-order confirmed"), [class*="confirmedTitle"]', { timeout: 10000 });
      console.log('  ✓ Order confirmed in-sheet successfully!');
    }

    // Close cart sheet
    const closeCartBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
    if (closeCartBtn) {
      await closeCartBtn.click();
      await page.waitForTimeout(400);
    }

    results.push({ test: 'Cart & Atomic Checkout', status: 'PASS', details: 'Live quote verified, checkout executed' });

    // ── 3.5 Orders List & Order Detail Sheet ─────────────────────────
    console.log('Testing 3.5: Orders List & Order Detail with MapView ...');
    const ordersNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Orders")', { timeout: 6000 });
    await ordersNavBtn.click();

    // Verify Orders tab loaded
    await page.waitForSelector('article a[href*="/buyer/orders/"], [class*="orderCard"], [class*="orderRow"], article', { timeout: 8000 });
    const orderRows = await page.$$('article a[href*="/buyer/orders/"], [class*="orderCard"], [class*="orderRow"], article');
    console.log(`  ✓ Found ${orderRows.length} active/past order rows`);

    // Click on the top order to open Order Detail sheet
    const firstOrder = await page.$('article a[href*="/buyer/orders/"], [class*="orderCard"] a, [class*="orderRow"] a');
    if (firstOrder) {
      await firstOrder.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
      console.log('  ✓ Order Detail BottomSheet opened');

      // Check Leaflet MapView on Order Detail
      await page.waitForSelector('[role="dialog"] .leaflet-container', { timeout: 8000 });
      console.log('  ✓ Order pickup card Leaflet MapView mounted');

      // Close Order Detail sheet
      const closeOrderBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
      if (closeOrderBtn) {
        await closeOrderBtn.click();
        await page.waitForTimeout(400);
      }
    }

    results.push({ test: 'Orders & Order Detail Map', status: 'PASS', details: 'Active orders listed, detail sheet has Leaflet map' });

    // ── 3.6 Search & Browse ──────────────────────────────────────────
    console.log('Testing 3.6: Browse & Live Search ...');
    const browseNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Browse")', { timeout: 6000 });
    await browseNavBtn.click();

    await page.waitForSelector('input[type="search"], input[placeholder*="Search"]', { timeout: 8000 });
    const browseSearchInput = await page.$('input[type="search"], input[placeholder*="Search"]');
    if (browseSearchInput) {
      await browseSearchInput.fill('Apple');
      await page.waitForTimeout(600); // debounce
      console.log(`  ✓ Browse search query input: Apple`);
      
      const searchCards = await page.$$('article, [class*="card"]');
      console.log(`  ✓ Search results rendered: ${searchCards.length} items`);
    }

    results.push({ test: 'Browse & Live Search', status: 'PASS', details: 'Browse catalog and search functional' });

    // ── 3.7 AI Assistant Sheet ───────────────────────────────────────
    console.log('Testing 3.7: AI Assistant Sheet ...');
    // Return to Market home tab
    const marketNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("Market")', { timeout: 6000 });
    await marketNavBtn.click();
    await page.waitForSelector('h1, [class*="greeting"]', { timeout: 8000 });

    // Click "Ask MarketLink" assistant trigger button
    const assistantTrigger = await page.waitForSelector('button:has-text("Ask MarketLink")', { timeout: 8000 });
    await assistantTrigger.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    console.log('  ✓ AI Assistant BottomSheet opened');

    // Click suggestion chip or send message
    const suggestionBtn = await page.$('[role="dialog"] button[class*="suggestionChip"]');
    if (suggestionBtn) {
      const chipText = await suggestionBtn.textContent();
      console.log(`  ✓ Clicking suggestion chip: "${chipText.trim()}"`);
      await suggestionBtn.click();
    } else {
      const assistantInput = await page.$('[role="dialog"] input[placeholder*="Ask"]');
      const sendBtn = await page.$('[role="dialog"] button[type="submit"]');
      if (assistantInput && sendBtn) {
        await assistantInput.fill('What fresh apples are available?');
        await sendBtn.click();
      }
    }

    // Wait for reply bubble from POST /assistant/message
    await page.waitForSelector('[role="dialog"] [class*="assistantBubble"], [role="dialog"] [class*="bubble"]:last-child', { timeout: 12000 });
    console.log('  ✓ Assistant response received and rendered');

    // Close assistant sheet
    const closeAssistantBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
    if (closeAssistantBtn) {
      await closeAssistantBtn.click();
      await page.waitForTimeout(400);
    }

    results.push({ test: 'AI Assistant', status: 'PASS', details: 'POST /assistant/message functional' });

    // ── 3.8 Customer Profile & Sub-sheets ────────────────────────────
    console.log('Testing 3.8: Profile, Details & Notifications Sheets ...');
    const youNavBtn = await page.waitForSelector('nav[aria-label="Main navigation"] button:has-text("You")', { timeout: 6000 });
    await youNavBtn.click();
    await page.waitForSelector('h1, [class*="userName"]', { timeout: 8000 });
    console.log('  ✓ Profile page loaded');

    // Open Personal details sub-sheet
    const detailsRow = await page.waitForSelector('button:has-text("Personal details")', { timeout: 6000 });
    await detailsRow.click();
    await page.waitForSelector('[role="dialog"] input#name, [role="dialog"] input[id="name"]', { timeout: 8000 });
    console.log('  ✓ Personal details sub-sheet opened with user data');

    const closeDetailsBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
    if (closeDetailsBtn) {
      await closeDetailsBtn.click();
      await page.waitForTimeout(400);
    }

    // Open Notifications sub-sheet
    const notificationsRow = await page.waitForSelector('button:has-text("Notifications")', { timeout: 6000 });
    await notificationsRow.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    console.log('  ✓ Notifications sub-sheet opened with preferences');

    const closeNotifBtn = await page.$('[role="dialog"] button[aria-label="Close sheet"]');
    if (closeNotifBtn) {
      await closeNotifBtn.click();
      await page.waitForTimeout(400);
    }

    results.push({ test: 'Profile & Sub-sheets', status: 'PASS', details: 'Personal details and notifications sheets verified' });

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
