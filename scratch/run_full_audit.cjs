const { chromium } = require('playwright');
const fs = require('fs');

const VIEWPORT_WIDTHS = [
  { name: '320px', width: 320, height: 568 },
  { name: '360px', width: 360, height: 800 },
  { name: '390px', width: 390, height: 844 },
  { name: '430px', width: 430, height: 932 },
  { name: '600px', width: 600, height: 960 },
  { name: '768px (tablet portrait)', width: 768, height: 1024 },
  { name: '820px', width: 820, height: 1180 },
  { name: '1024px (tablet landscape)', width: 1024, height: 768 },
  { name: '1180px', width: 1180, height: 820 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
  { name: '844x390 (phone landscape)', width: 844, height: 390 },
];

const PAGES_TO_AUDIT = [
  { url: 'http://localhost:3000/', name: 'Guest Home', auth: false },
  { url: 'http://localhost:3000/about', name: 'Guest About', auth: false },
  { url: 'http://localhost:3000/contact', name: 'Guest Contact', auth: false },
  { url: 'http://localhost:3000/login', name: 'Guest Login', auth: false },
  { url: 'http://localhost:3000/register', name: 'Guest Register', auth: false },
  { url: 'http://localhost:3000/buyer', name: 'Customer Home', auth: true },
  { url: 'http://localhost:3000/buyer/products', name: 'Customer Browse', auth: true },
  { url: 'http://localhost:3000/buyer/orders', name: 'Customer Orders', auth: true },
  { url: 'http://localhost:3000/buyer/favorites', name: 'Customer Favorites', auth: true },
  { url: 'http://localhost:3000/buyer/profile', name: 'Customer Profile', auth: true },
  { url: 'http://localhost:3000/buyer/cart', name: 'Cart Sheet', auth: true },
  { url: 'http://localhost:3000/buyer/products/p-01', name: 'Product Sheet', auth: true },
  { url: 'http://localhost:3000/buyer/farmers/f-riverbend', name: 'Farmer Sheet', auth: true },
  { url: 'http://localhost:3000/buyer/orders/ord-001', name: 'Order Sheet', auth: true },
  { url: 'http://localhost:3000/buyer/assistant', name: 'Assistant Sheet', auth: true },
];

async function runAudit() {
  console.log('🚀 Running Comprehensive Layout Audit with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const allFindings = [];

  for (const vp of VIEWPORT_WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    const page = await context.newPage();

    for (const target of PAGES_TO_AUDIT) {
      if (target.auth) {
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
      }

      try {
        await page.goto(target.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const issues = await page.evaluate(() => {
          if (typeof window.layoutCheck === 'function') {
            return window.layoutCheck();
          }
          return [{ type: 'BUG', selector: 'window', message: 'layoutCheck not mounted' }];
        });

        if (issues && issues.length > 0) {
          for (const iss of issues) {
            allFindings.push({
              page: target.name,
              viewport: vp.name,
              type: iss.type,
              selector: iss.selector,
              message: iss.message,
            });
          }
        }
      } catch (err) {
        console.error(`Error loading ${target.name} at ${vp.name}:`, err.message);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n================ AUDIT SUMMARY ================`);
  console.log(`Total Findings: ${allFindings.length}`);
  const byType = {};
  for (const f of allFindings) {
    byType[f.type] = (byType[f.type] || 0) + 1;
  }
  console.log('Findings by type:', byType);

  fs.writeFileSync('scratch/audit_results_after_fixes.json', JSON.stringify(allFindings, null, 2));
  console.log('Saved findings to scratch/audit_results_after_fixes.json');

  if (allFindings.length > 0) {
    console.log('\nRemaining Findings Sample:');
    allFindings.slice(0, 20).forEach(f => {
      console.log(`[${f.viewport}] ${f.page} -> [${f.type}] ${f.selector}: ${f.message}`);
    });
  }
}

runAudit();
