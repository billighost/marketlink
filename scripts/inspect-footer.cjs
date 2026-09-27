const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const footer = await page.locator('footer');
  await footer.waitFor();
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await footer.boundingBox();
  console.log('FOOTER_HEIGHT:', box.height);
  console.log('FOOTER_BOX:', JSON.stringify(box));
  await footer.screenshot({ path: 'footer_before_clip.png' });
  await browser.close();
})();
