import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  const skeletons = await page.evaluate(() => {
    const elList = Array.from(document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]'));
    return elList.map(el => ({
      tagName: el.tagName,
      className: el.className,
      parentClass: el.parentElement?.className,
      outerHTML: el.outerHTML.slice(0, 150),
    }));
  });

  console.log('Skeletons details:', JSON.stringify(skeletons, null, 2));

  await browser.close();
})();
