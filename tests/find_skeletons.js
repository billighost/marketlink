import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const skeletons = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]'));
    return list.map(el => ({
      tag: el.tagName,
      className: el.className,
      outerHTML: el.outerHTML.slice(0, 150),
      parentClass: el.parentElement?.className,
    }));
  });

  console.log('Found skeletons:', JSON.stringify(skeletons, null, 2));
  await browser.close();
})();
