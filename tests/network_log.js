import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('request', req => {
    console.log('REQUEST:', req.method(), req.url());
  });
  page.on('response', res => {
    console.log('RESPONSE:', res.status(), res.url());
  });
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => {
    return {
      homeLoadingSkeletons: document.querySelectorAll('[class*="skeleton"]').length,
    };
  });
  console.log('FINAL STATE:', state);

  await browser.close();
})();
