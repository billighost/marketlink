const { chromium } = require('playwright');

const TEST_VPS = [
  { name: '320px', width: 320, height: 568 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px (tablet portrait)', width: 768, height: 1024 },
  { name: '1024px (tablet landscape)', width: 1024, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '844x390 (phone landscape)', width: 844, height: 390 },
];

const TEST_PAGES = [
  { url: 'http://localhost:3000/', name: 'Guest Home', auth: false },
  { url: 'http://localhost:3000/login', name: 'Guest Login', auth: false },
  { url: 'http://localhost:3000/contact', name: 'Guest Contact', auth: false },
  { url: 'http://localhost:3000/buyer', name: 'Customer Home', auth: true },
  { url: 'http://localhost:3000/buyer/products', name: 'Customer Browse', auth: true },
  { url: 'http://localhost:3000/buyer/products/prod-honey', name: 'Product Sheet', auth: true },
  { url: 'http://localhost:3000/buyer/assistant', name: 'Assistant Sheet', auth: true },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  let totalIssues = 0;

  for (const vp of TEST_VPS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const target of TEST_PAGES) {
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

      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const issues = await page.evaluate(() => {
        return window.layoutCheck ? window.layoutCheck() : [{ type: 'BUG', message: 'no layoutCheck' }];
      });

      if (issues.length > 0) {
        console.log(`[${vp.name}] ${target.name}: ${issues.length} issue(s)`);
        issues.forEach(iss => console.log(`   - [${iss.type}] ${iss.selector}: ${iss.message}`));
        totalIssues += issues.length;
      }
    }
    await context.close();
  }

  await browser.close();
  console.log(`\n>>> Quick check complete! Total issues: ${totalIssues} <<<`);
}

run();
