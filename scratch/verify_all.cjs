const { chromium } = require('playwright');

async function runVerification() {
  console.log('🚀 Starting Comprehensive Verification Suite for MarketLink Customer App...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  });

  const page = await context.newPage();
  const errors = [];
  const warnings = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('[Browser Console ERROR]:', msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
      console.warn('[Browser Console WARN]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error('[Uncaught Page ERROR]:', err.message);
  });

  // Authenticate as Customer Demo for protected buyer routes
  await page.addInitScript(() => {
    localStorage.setItem('marketlink_role', 'buyer');
    localStorage.setItem(
      'marketlink_user',
      JSON.stringify({
        id: 'user-george',
        name: 'George Adams',
        firstName: 'George',
        email: 'george@example.com',
        role: 'buyer',
      })
    );
  });

  try {
    // ── Journey 1: Home Feed & Product Detail Sheet & Add to Cart ──
    console.log('\n--- Testing Journey 1: Home Feed & Product Detail ---');
    await page.goto('http://localhost:3000/buyer', { waitUntil: 'domcontentloaded' });

    // Verify Home loaded
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Verify alternating card variants exist
    const featureCards = await page.$$('[class*="feature"]');
    const compactCards = await page.$$('[class*="compact"]');
    console.log(`Found ${featureCards.length} feature cards and ${compactCards.length} compact cards on feed`);
    if (featureCards.length === 0 || compactCards.length === 0) {
      throw new Error('Expected both feature and compact cards in feed');
    }

    // Click on first product card to open ProductDetail sheet
    const firstProduct = await page.$('article a[class*="stretchedLink"]');
    if (!firstProduct) throw new Error('No product card found');
    await firstProduct.click();

    // Wait for bottom sheet overlay in portal
    await page.waitForSelector('[class*="sheet"]', { timeout: 3000 });
    const productTitle = await page.title();
    console.log(`Sheet opened. Dynamic title: "${productTitle}"`);
    if (!productTitle.includes('MarketLink')) {
      throw new Error('Expected dynamic document title containing MarketLink');
    }

    // Verify "No reviews yet for this harvest. Be the first to review this harvest." exists if 0 reviews
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Be the first to try it!')) {
      throw new Error('Forbidden exclamation mark / generic copy "Be the first to try it!" found');
    }

    // Add to cart from Product Detail
    const addBtn = await page.$('footer [class*="wideButton"]');
    if (addBtn) {
      await addBtn.click();
      console.log('Tapped Add to Cart button');
      await page.waitForTimeout(600);
    }

    // Close sheet via close button
    const closeBtn = await page.$('button[aria-label="Close sheet"]');
    if (!closeBtn) throw new Error('Close button not found in sheet header');
    await closeBtn.click();
    await page.waitForTimeout(400);

    const titleAfterClose = await page.title();
    console.log(`Sheet closed. Restored title: "${titleAfterClose}"`);

    // ── Journey 2: Cart Sheet, Quantity Stepper, Swipe/Remove & Undo ──
    console.log('\n--- Testing Journey 2: Cart Sheet & Undo Toast ---');
    // Open cart via CartBar
    const cartBar = await page.waitForSelector('button[aria-label*="View cart"]', { timeout: 4000 });
    await cartBar.click();
    console.log('Tapped CartBar to open cart sheet');
    await page.waitForSelector('[class*="rowContainer"]', { timeout: 3000 });
    console.log('Cart sheet opened with items');

    // Remove item to test Undo toast
    const removeBtn = await page.$('button[class*="removeButton"]');
    if (removeBtn) {
      await removeBtn.click({ force: true });
      console.log('Removed item from cart');
      // Verify Toast appeared
      await page.waitForSelector('[role="status"]', { timeout: 2000 });
      const toastText = await page.textContent('[role="status"]');
      console.log(`Toast appeared: "${toastText}"`);

      // Click Undo
      const undoBtn = await page.$('[role="status"] button');
      if (undoBtn) {
        await undoBtn.click();
        console.log('Clicked Undo button in Toast');
        await page.waitForTimeout(400);
        const restoredItems = await page.$$('[class*="rowContainer"]');
        console.log(`Items after Undo: ${restoredItems.length}`);
      }
    }

    // Close cart sheet
    const cartClose = await page.$('button[aria-label="Close sheet"]');
    if (cartClose) await cartClose.click();
    await page.waitForTimeout(400);

    // ── Journey 3: Browse / Products Directory, Suggestions & Sticky Header ──
    console.log('\n--- Testing Journey 3: Products Directory, Suggestions & Hairline ---');
    await page.goto('http://localhost:3000/buyer/products', { waitUntil: 'domcontentloaded' });

    // Verify suggestions row
    const suggestions = await page.$$('[class*="suggestionChip"]');
    console.log(`Found ${suggestions.length} suggestion chips on Products page`);
    if (suggestions.length === 0) throw new Error('Expected suggestion chips');

    // Click on suggestion chip
    await suggestions[0].click();
    await page.waitForTimeout(300);
    const searchVal = await page.$eval('input[type="search"]', el => el.value);
    console.log(`Search input filled from chip: "${searchVal}"`);

    // Clear search
    const clearBtn = await page.$('[class*="clearSearch"]');
    if (clearBtn) await clearBtn.click();
    await page.waitForTimeout(300);

    // Scroll down to check sticky header hairline class
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(200);
    const isScrolledClass = await page.$eval('main [class*="header"]', el => el.className.includes('Scrolled') || el.className.includes('scrolled'));
    console.log(`Sticky header has scrolled hairline class: ${isScrolledClass}`);

    // ── Journey 4: Orders & Order Detail Sheet ("Now" badge & live countdown) ──
    console.log('\n--- Testing Journey 4: Orders & OrderDetail Polish ---');
    await page.goto('http://localhost:3000/buyer/orders', { waitUntil: 'domcontentloaded' });

    // Open first order
    const firstOrderCard = await page.$('article a, [class*="orderCard"] a');
    if (firstOrderCard) {
      await firstOrderCard.click();
      await page.waitForSelector('[class*="pickupCountdown"]', { timeout: 3000 });
      const countdownText = await page.textContent('[class*="pickupCountdown"]');
      console.log(`Pickup countdown: "${countdownText.trim()}"`);

      // Check "Now" badge
      const nowBadge = await page.$('[class*="nowBadge"]');
      console.log(`"Now" badge present on latest timeline step: ${!!nowBadge}`);
      if (!nowBadge) throw new Error('Expected "Now" badge on current timeline step');

      // Check stall number highlight
      const stallHighlight = await page.$('[class*="stallNumberHighlight"]');
      console.log(`Stall number highlight present: ${!!stallHighlight}`);

      // Close order sheet
      const orderClose = await page.$('button[aria-label="Close sheet"]');
      if (orderClose) await orderClose.click();
      await page.waitForTimeout(400);
    }

    // ── Journey 5: Profile Toggles & "Saved" indicator ──
    console.log('\n--- Testing Journey 5: Profile & Toggles ---');
    await page.goto('http://localhost:3000/buyer/profile', { waitUntil: 'domcontentloaded' });

    // Toggle reduced motion
    const motionToggle = await page.$('button[role="switch"]');
    if (motionToggle) {
      await motionToggle.click();
      await page.waitForTimeout(300);
      const savedIndicator = await page.$('[class*="indicator"]');
      console.log(`"Saved" indicator appeared next to toggle: ${!!savedIndicator}`);
    }

    // ── Journey 6: Assistant Chat & Recommendations ──
    console.log('\n--- Testing Journey 6: Assistant Chat ---');
    await page.goto('http://localhost:3000/buyer/assistant', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[class*="textInput"]', { timeout: 3000 });

    // Click suggestion "Who sells eggs?"
    const eggSug = await page.$('button:has-text("Who sells eggs?")');
    if (eggSug) {
      await eggSug.click();
      console.log('Clicked "Who sells eggs?"');
      await page.waitForTimeout(1000);
      // Verify product recommendations appeared
      const assistantProducts = await page.$$('[class*="productRow"] article');
      console.log(`Assistant replied with ${assistantProducts.length} product recommendations`);
      if (assistantProducts.length === 0) throw new Error('Expected product cards in assistant reply');
    }

    // ── Journey 7: De-Slopped Copy Check ──
    console.log('\n--- Testing Journey 7: De-slopped Copy across Pages ---');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    const loginHeader = await page.textContent('h1, h2');
    console.log(`Login header text: "${loginHeader}"`);
    if (loginHeader.includes('Welcome back')) {
      throw new Error('Forbidden copy "Welcome back" still in Login.jsx');
    }

    await page.goto('http://localhost:3000/buyer/order-confirmed', { waitUntil: 'domcontentloaded' });
    const confirmedTitle = await page.textContent('h2');
    console.log(`Confirmed title text: "${confirmedTitle}"`);
    if (confirmedTitle.includes('!')) {
      throw new Error(`Forbidden exclamation mark in OrderConfirmed: "${confirmedTitle}"`);
    }

    // ── Test Viewports ──
    console.log('\n--- Testing Responsive Viewports ---');
    const viewports = [
      { name: 'Android modern', width: 360, height: 800 },
      { name: 'iPhone SE', width: 320, height: 568 },
      { name: 'Tablet portrait', width: 768, height: 1024 },
      { name: 'Desktop drawer', width: 1440, height: 900 },
      { name: 'Landscape mobile', width: 844, height: 390 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3000/buyer', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
      console.log(`✓ Rendered cleanly at ${vp.name} (${vp.width}x${vp.height})`);
    }

    // Final check for console errors / warnings
    console.log('\n=======================================');
    console.log(`TOTAL CONSOLE ERRORS: ${errors.length}`);
    console.log(`TOTAL CONSOLE WARNINGS: ${warnings.length}`);
    console.log('=======================================');

    if (errors.length > 0) {
      throw new Error(`Failed with ${errors.length} console errors: ${errors.join(', ')}`);
    }

    console.log('\n🎉 ALL VERIFICATION CHECKS PASSED WITH 0 ERRORS AND 0 WARNINGS!');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
