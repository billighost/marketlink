import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  const content = await page.evaluate(() => {
    return {
      title: document.title,
      skeletonsCount: document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]').length,
      marketCardsCount: document.querySelectorAll('[class*="marketCard"]').length,
      productCardsCount: document.querySelectorAll('[class*="productCard"]').length,
      farmerCardsCount: document.querySelectorAll('[class*="farmerCard"]').length,
      emptyStatesCount: document.querySelectorAll('[class*="empty"]').length,
      bodyTextSnippet: document.body.innerText.slice(0, 500),
    };
  });

  console.log('Render Evaluation:', JSON.stringify(content, null, 2));

  await browser.close();
})();
