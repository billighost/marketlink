const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  const viewports = [
    { name: 'mobile_390px', width: 390, height: 844 },
    { name: 'mobile_360px', width: 360, height: 740 },
    { name: 'tablet_768px', width: 768, height: 1024 },
    { name: 'desktop_1280px', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const footer = await page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const box = await footer.boundingBox();
    console.log(`[LIVE] ${vp.name}: Footer height = ${box.height}px`);
    await footer.screenshot({ path: `live_footer_${vp.name}.png` });
    await page.close();
  }

  await browser.close();
})();
