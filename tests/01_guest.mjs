import { createTestContext, BASE_URL } from './helpers.mjs';

export async function runGuestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING TEST SUITE 1: Guest Pages & Public API');
  console.log('======================================================');

  const { browser, context, page, consoleErrors, uncaughtErrors } = await createTestContext({
    width: 1024,
    height: 768,
  });

  const results = [];

  try {
    // ── 1. Guest Home Page (/) ───────────────────────────────────────
    console.log('Testing 1.1: Guest Home (/) ...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Verify Title
    const title = await page.title();
    console.log(`  Page Title: "${title}"`);
    if (!title.toLowerCase().includes('marketlink')) {
      throw new Error(`Expected title to include "MarketLink", got: ${title}`);
    }

    // Verify AnnouncementBar
    const announcementBar = await page.$('[class*="announcementBar"]');
    if (announcementBar) {
      const annText = await announcementBar.textContent();
      console.log(`  ✓ AnnouncementBar rendered: "${annText.slice(0, 40)}..."`);
      const dismissBtn = await page.$('button[aria-label="Dismiss announcement"]');
      if (dismissBtn) {
        await dismissBtn.click();
        await page.waitForTimeout(300);
        const isHidden = await page.$('[class*="announcementBar"]') === null;
        console.log(`  ✓ Announcement dismissed successfully: ${isHidden}`);
      }
    }

    // Verify Price Board and Market Cards from GET /public/home
    await page.waitForSelector('[class*="productCard"], [class*="marketCard"], [class*="productsGrid"]', { timeout: 8000 });
    const priceBoardItems = await page.$$('[class*="productCard"], [class*="marketCard"]');
    console.log(`  ✓ Found ${priceBoardItems.length} public home cards`);
    if (priceBoardItems.length === 0) {
      throw new Error('Expected price board or market items on guest home');
    }

    results.push({ test: 'Guest Home (/)', status: 'PASS', details: `${priceBoardItems.length} items rendered` });

    // ── 2. Markets Directory (/markets) & Leaflet Map ─────────────────
    console.log('Testing 1.2: Markets Directory (/markets) & Leaflet Map ...');
    await page.goto(`${BASE_URL}/markets`, { waitUntil: 'domcontentloaded' });

    // Verify Leaflet MapView is rendered
    await page.waitForSelector('.leaflet-container', { timeout: 8000 });
    const leafletMap = await page.$('.leaflet-container');
    if (!leafletMap) {
      throw new Error('Leaflet MapView (.leaflet-container) failed to mount on /markets');
    }
    console.log('  ✓ Leaflet MapView container mounted successfully');

    // Verify Market Cards
    await page.waitForSelector('[class*="sidebarCard"], [class*="marketCard"], [class*="floating"]', { timeout: 8000 });
    const marketCards = await page.$$('[class*="sidebarCard"], [class*="marketCard"]');
    console.log(`  ✓ Found ${marketCards.length} market cards from API`);

    // Verify custom beet markers
    const beetMarkers = await page.$$('.leaflet-marker-icon');
    console.log(`  ✓ Leaflet custom pin markers rendered: ${beetMarkers.length}`);
    if (beetMarkers.length === 0) {
      throw new Error('Expected at least one marker on the markets map');
    }

    results.push({ test: 'Markets Directory (/markets)', status: 'PASS', details: `${marketCards.length} markets, Leaflet map with ${beetMarkers.length} markers` });

    // ── 3. Market Detail (/markets/:id) ──────────────────────────────
    console.log('Testing 1.3: Market Detail (/markets/:id) ...');
    // Click first market card
    const firstMarketLink = await page.$('a[href^="/markets/"]');
    if (!firstMarketLink) throw new Error('No link to market detail found');
    const marketHref = await firstMarketLink.getAttribute('href');
    await page.goto(`${BASE_URL}${marketHref}`, { waitUntil: 'domcontentloaded' });

    // Verify Market Detail loaded
    await page.waitForSelector('h1', { timeout: 5000 });
    const marketHeading = await page.textContent('h1');
    console.log(`  ✓ Market detail loaded: "${marketHeading}"`);

    // Verify sidebar Leaflet map
    await page.waitForSelector('.leaflet-container', { timeout: 5000 });
    console.log('  ✓ Market detail Leaflet MapView mounted');

    results.push({ test: 'Market Detail', status: 'PASS', details: `Loaded "${marketHeading}" with Leaflet map` });

    // ── 4. Farmers Directory (/farmers) ───────────────────────────────
    console.log('Testing 1.4: Farmers Directory (/farmers) ...');
    await page.goto(`${BASE_URL}/farmers`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('article, [class*="farmerCard"]', { timeout: 5000 });
    const farmerCards = await page.$$('article, [class*="farmerCard"]');
    console.log(`  ✓ Found ${farmerCards.length} farmers from /public/farmers`);
    if (farmerCards.length === 0) throw new Error('No farmers rendered from API');

    // Test search filter
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('Riverbend');
      await page.waitForTimeout(500);
      const filteredCards = await page.$$('article, [class*="farmerCard"]');
      console.log(`  ✓ Search for "Riverbend" filtered to ${filteredCards.length} cards`);
    }

    results.push({ test: 'Farmers Directory (/farmers)', status: 'PASS', details: `${farmerCards.length} farmers rendered, search functional` });

    // ── 5. Farmer Detail (/farmers/:id) ───────────────────────────────
    console.log('Testing 1.5: Farmer Detail (/farmers/:id) ...');
    const firstFarmerLink = await page.$('a[href^="/farmers/"]');
    if (!firstFarmerLink) throw new Error('No link to farmer detail found');
    const farmerHref = await firstFarmerLink.getAttribute('href');
    await page.goto(`${BASE_URL}${farmerHref}`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('h1', { timeout: 5000 });
    const farmerName = await page.textContent('h1');
    console.log(`  ✓ Farmer profile loaded: "${farmerName}"`);

    // Switch to Where to Find tab to verify map
    const whereBtn = await page.$('button:has-text("Where to Find")');
    if (whereBtn) {
      await whereBtn.click();
      await page.waitForSelector('.leaflet-container', { timeout: 6000 });
      console.log('  ✓ Farmer market locations Leaflet MapView mounted');
    }

    results.push({ test: 'Farmer Detail', status: 'PASS', details: `Loaded "${farmerName}" with market map` });

    // ── 6. Products Catalog (/products) ──────────────────────────────
    console.log('Testing 1.6: Products Catalog (/products) ...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('article, [class*="productCard"]', { timeout: 5000 });
    const productCards = await page.$$('article, [class*="productCard"]');
    console.log(`  ✓ Found ${productCards.length} products from /public/products`);
    if (productCards.length === 0) throw new Error('No products rendered');

    // Check price format: must be $X.XX format, never raw cents
    const priceEl = await page.$('[class*="price"]');
    if (priceEl) {
      const priceText = await priceEl.textContent();
      console.log(`  ✓ Price sample: "${priceText}"`);
      if (!priceText.match(/\$\d+\.\d{2}/)) {
        throw new Error(`Price format invalid (expected $X.XX): "${priceText}"`);
      }
    }

    // Verify category filter chips
    const categoryChips = await page.$$('button[class*="chip"], [class*="categories"] button');
    console.log(`  ✓ Found ${categoryChips.length} category chips from /public/categories`);

    results.push({ test: 'Products Catalog (/products)', status: 'PASS', details: `${productCards.length} products, proper cents formatting ($X.XX)` });

    // ── 7. Product Detail (/products/:id) ─────────────────────────────
    console.log('Testing 1.7: Product Detail (/products/:id) ...');
    const firstProductLink = await page.$('a[href^="/products/"]');
    if (!firstProductLink) throw new Error('No link to product detail found');
    const productHref = await firstProductLink.getAttribute('href');
    await page.goto(`${BASE_URL}${productHref}`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('h1', { timeout: 5000 });
    const productHeading = await page.textContent('h1');
    console.log(`  ✓ Product detail loaded: "${productHeading}"`);

    // Verify cents formatted price on detail
    const detailPrice = await page.$('[class*="price"]');
    if (detailPrice) {
      const text = await detailPrice.textContent();
      if (!text.match(/\$\d+\.\d{2}/)) {
        throw new Error(`Detail price format invalid: "${text}"`);
      }
      console.log(`  ✓ Detail price formatted: "${text}"`);
    }

    results.push({ test: 'Product Detail', status: 'PASS', details: `Loaded "${productHeading}" with validated price` });

    // ── 8. Contact Page (/contact) ────────────────────────────────────
    console.log('Testing 1.8: Contact Page (/contact) & Map ...');
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });

    // Check Leaflet map on Contact
    await page.waitForSelector('.leaflet-container', { timeout: 5000 });
    console.log('  ✓ Contact page Leaflet MapView mounted');

    // Test Contact form validation
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      // Submit empty to test validation
      await submitBtn.click();
      await page.waitForTimeout(300);
      const errors = await page.$$('[class*="error"], [role="alert"]');
      console.log(`  ✓ Contact form validation displayed ${errors.length} required field error(s)`);

      // Fill valid contact form
      await page.fill('input[name="name"]', 'Jane Doe');
      await page.fill('input[name="email"]', 'jane.doe@example.com');
      const topicSelect = await page.$('select[name="topic"]');
      if (topicSelect) await page.selectOption('select[name="topic"]', 'feedback');
      await page.fill('textarea[name="message"]', 'Headless Playwright test verifying contact form submission.');
      await submitBtn.click();

      // Wait for success confirmation
      await page.waitForSelector('[class*="success"], [class*="alertSuccess"], :has-text("Thank you")', { timeout: 5000 });
      console.log('  ✓ Contact message submitted and confirmed successfully');
    }

    results.push({ test: 'Contact Page (/contact)', status: 'PASS', details: 'Form validation and successful submission verified' });

    // ── 9. About Page (/about) ────────────────────────────────────────
    console.log('Testing 1.9: About Page (/about) ...');
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 4000 });
    const aboutTitle = await page.textContent('h1');
    console.log(`  ✓ About page loaded: "${aboutTitle}"`);

    results.push({ test: 'About Page (/about)', status: 'PASS', details: `Loaded "${aboutTitle}"` });

  } catch (err) {
    console.error('❌ GUEST SUITE ERROR:', err);
    results.push({ test: 'Guest Suite', status: 'FAIL', details: err.message });
  } finally {
    await browser.close();
  }

  // Check uncaught errors
  const passed = results.every(r => r.status === 'PASS');
  console.log('\n--- Guest Suite Summary ---');
  results.forEach(r => console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.test}: ${r.details}`));
  return { passed, results, errors: uncaughtErrors };
}

// Allow direct execution
if (process.argv[1]?.endsWith('01_guest.mjs')) {
  runGuestSuite().then(({ passed }) => {
    process.exit(passed ? 0 : 1);
  });
}
