const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(500);

  const el = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(e => {
      const rect = e.getBoundingClientRect();
      return Math.round(rect.right) >= 340 && Math.round(rect.right) <= 355;
    }).map(e => ({ tag: e.tagName, className: e.className, outer: e.outerHTML.slice(0, 100), rect: e.getBoundingClientRect() }));
  });
  console.log('Elements with right ~347px:', el);
  await browser.close();
})();
