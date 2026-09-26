import { chromium } from 'playwright';

async function run() {
  console.log('Starting Playwright browser verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push(`${req.url()} (${req.failure()?.errorText})`);
  });

  console.log('Navigating to http://localhost:3000...');
  const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log(`Page load status: ${response.status()}`);

  // Fetch manifest
  const manifestRes = await page.goto('http://localhost:3000/manifest.webmanifest');
  console.log(`Manifest URL status: ${manifestRes.status()}, content-type: ${manifestRes.headers()['content-type']}`);
  const manifestJson = await manifestRes.json();
  console.log('Manifest content loaded:');
  console.log(JSON.stringify(manifestJson, null, 2));

  // Verify all icon URLs in manifest return 200 OK
  console.log('\nVerifying manifest icons HTTP status:');
  for (const icon of manifestJson.icons) {
    const iconRes = await page.goto(`http://localhost:3000${icon.src}`);
    console.log(`- Icon ${icon.src} (${icon.sizes}, ${icon.purpose}): ${iconRes.status()} ${iconRes.headers()['content-type']}`);
  }

  // Verify head elements in HTML
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  const manifestLink = await page.$eval('link[rel="manifest"]', el => el.getAttribute('href'));
  const faviconSvg = await page.$eval('link[rel="icon"][type="image/svg+xml"]', el => el.getAttribute('href'));
  const appleTouch = await page.$eval('link[rel="apple-touch-icon"]', el => el.getAttribute('href'));
  const themeColor = await page.$eval('meta[name="theme-color"]', el => el.getAttribute('content'));
  const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content'));

  console.log('\nHead Link & Meta Verification:');
  console.log(`- link[rel="manifest"]: ${manifestLink}`);
  console.log(`- link[rel="icon"][type="image/svg+xml"]: ${faviconSvg}`);
  console.log(`- link[rel="apple-touch-icon"]: ${appleTouch}`);
  console.log(`- meta[name="theme-color"]: ${themeColor}`);
  console.log(`- meta[property="og:image"]: ${ogImage}`);

  console.log('\nConsole Errors:', consoleErrors.length === 0 ? 'NONE (PASS)' : consoleErrors);
  console.log('Failed Requests:', failedRequests.length === 0 ? 'NONE (PASS)' : failedRequests);

  await browser.close();
}

run().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
