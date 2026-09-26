import { chromium } from 'playwright';

async function runTests() {
  console.log('--- Launching Headless Playwright ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    guestHome: null,
    emptyMarketDetail: null,
    marketWithStalls: null,
    guest404: null,
    buyer404: null,
    unauthorized: null,
  };

  // Test 1: Guest Home Page
  console.log('\n[Test 1] Testing Guest Home Page (/) ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // give time for hooks / data resolution

  const homeData = await page.evaluate(() => {
    const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]');
    const productCards = document.querySelectorAll('[class*="productCard"]');
    const farmerCards = document.querySelectorAll('[class*="farmerCard"]');
    const marketCards = document.querySelectorAll('[class*="marketCard"]');
    const svgs = Array.from(document.querySelectorAll('svg')).map(s => ({
      classes: s.getAttribute('class'),
      width: s.getAttribute('width') || s.clientWidth,
      height: s.getAttribute('height') || s.clientHeight,
    }));
    return {
      title: document.title,
      skeletonsCount: skeletons.length,
      productCardsCount: productCards.length,
      farmerCardsCount: farmerCards.length,
      marketCardsCount: marketCards.length,
      svgCount: svgs.length,
    };
  });
  results.guestHome = homeData;
  console.log('Guest Home result:', homeData);

  // Test 2: Fetch markets to test MarketDetail
  console.log('\n[Test 2] Querying backend /api/markets to find test market IDs ...');
  const marketsResponse = await page.request.get('http://localhost:4000/api/markets');
  let markets = [];
  if (marketsResponse.ok()) {
    const data = await marketsResponse.json();
    markets = Array.isArray(data) ? data : data.markets || data.data || [];
    console.log(`Found ${markets.length} markets in database.`);
  } else {
    console.log('Could not fetch /api/markets:', marketsResponse.status());
  }

  // Test 3: Buyer Market Detail - with or without stalls
  if (markets.length > 0) {
    const testMarket = markets[0];
    const marketId = testMarket._id || testMarket.id;
    console.log(`\n[Test 3] Testing Buyer Market Detail (/buyer/markets/${marketId}) ...`);
    await page.goto(`http://localhost:3000/buyer/markets/${marketId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const marketDetailData = await page.evaluate(() => {
      // Look for Stalls section
      const allHeadings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6')).map(h => h.innerText);
      const stallsHeadingFound = allHeadings.some(h => /stalls at this market/i.test(h));
      const stallCards = document.querySelectorAll('[class*="stallCard"]');
      const emptyStates = document.querySelectorAll('[class*="emptyState"], [class*="emptyContainer"]');
      return {
        allHeadings,
        stallsHeadingFound,
        stallCardsCount: stallCards.length,
        emptyStatesCount: emptyStates.length,
      };
    });
    results.marketWithStalls = marketDetailData;
    console.log('Market Detail real page result:', marketDetailData);
  }

  // Test 4: Market with NO stalls - verify section is omitted!
  console.log('\n[Test 4] Testing Market with 0 stalls (mocking /api/markets/:id/stalls to return []) ...');
  // We can route and mock stalls response to empty array []
  await page.route('**/api/stalls*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stalls: [] }),
    });
  });
  await page.route('**/api/markets/*/stalls*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stalls: [] }),
    });
  });

  const dummyMarketId = markets[0] ? (markets[0]._id || markets[0].id) : 'test-market-id';
  await page.goto(`http://localhost:3000/buyer/markets/${dummyMarketId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emptyStallsData = await page.evaluate(() => {
    const allHeadings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6')).map(h => h.innerText);
    const stallsHeadingFound = allHeadings.some(h => /stalls at this market/i.test(h));
    const emptyStateWithStalls = Array.from(document.querySelectorAll('*')).some(el => 
      el.innerText && /no stalls|empty-basket|stall-empty/i.test(el.innerText)
    );
    return {
      allHeadings,
      stallsHeadingFound, // should be FALSE because section is omitted!
      emptyStateWithStalls, // should be FALSE
    };
  });
  results.emptyMarketDetail = emptyStallsData;
  console.log('Empty Stalls Market Detail result:', emptyStallsData);

  // Unroute mocks
  await page.unroute('**/api/stalls*');
  await page.unroute('**/api/markets/*/stalls*');

  // Test 5: Guest 404 Page (/nonexistent-route-12345)
  console.log('\n[Test 5] Testing Guest 404 Page (/not-found-xyz) ...');
  await page.goto('http://localhost:3000/not-found-xyz', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const guest404Data = await page.evaluate(() => {
    const bigSvgs = Array.from(document.querySelectorAll('svg')).filter(s => {
      const box = s.getBoundingClientRect();
      return box.width > 200 || box.height > 200;
    });
    const statusBadge = document.querySelector('[class*="statusBadge"], [class*="code"]')?.innerText;
    return {
      text: document.body.innerText.slice(0, 300),
      bigSvgsCount: bigSvgs.length, // should be 0 (no big SVG art illustrations)
      statusBadge,
      hasCompassOrCleanIcon: !!document.querySelector('svg'),
    };
  });
  results.guest404 = guest404Data;
  console.log('Guest 404 result:', guest404Data);

  // Test 6: Unauthorized Page (/unauthorized)
  console.log('\n[Test 6] Testing Unauthorized Page (/unauthorized) ...');
  await page.goto('http://localhost:3000/unauthorized', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const unauthData = await page.evaluate(() => {
    const bigSvgs = Array.from(document.querySelectorAll('svg')).filter(s => {
      const box = s.getBoundingClientRect();
      return box.width > 200 || box.height > 200;
    });
    return {
      text: document.body.innerText.slice(0, 300),
      bigSvgsCount: bigSvgs.length, // should be 0
      hasShieldIcon: !!document.querySelector('svg'),
    };
  });
  results.unauthorized = unauthData;
  console.log('Unauthorized result:', unauthData);

  // Test 7: Buyer 404 Page (/buyer/not-found-xyz)
  console.log('\n[Test 7] Testing Buyer 404 Page (/buyer/not-found-xyz) ...');
  await page.goto('http://localhost:3000/buyer/not-found-xyz', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const buyer404Data = await page.evaluate(() => {
    const bigSvgs = Array.from(document.querySelectorAll('svg')).filter(s => {
      const box = s.getBoundingClientRect();
      return box.width > 200 || box.height > 200;
    });
    return {
      text: document.body.innerText.slice(0, 300),
      bigSvgsCount: bigSvgs.length, // should be 0
      hasIconCircle: !!document.querySelector('[class*="iconCircle"], [class*="iconBadge"]'),
    };
  });
  results.buyer404 = buyer404Data;
  console.log('Buyer 404 result:', buyer404Data);

  await browser.close();
  console.log('\n--- All Headless Playwright Tests Completed Successfully ---');
  return results;
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
