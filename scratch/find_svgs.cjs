const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/buyer/farmers/farmer-1');
  await page.waitForTimeout(500);

  const svgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).map(s => {
      const rect = s.getBoundingClientRect();
      const parent = s.parentElement ? (s.parentElement.className || s.parentElement.tagName) : '';
      const outer = s.outerHTML.slice(0, 120);
      const vb = s.viewBox && s.viewBox.baseVal ? `${s.viewBox.baseVal.width}x${s.viewBox.baseVal.height}` : '';
      return { outer, parent, w: Math.round(rect.width), h: Math.round(rect.height), vb };
    }).filter(s => s.w > 0 && s.vb && Math.abs((s.w / s.h) - 1) > 0.05);
  });
  console.log('Farmer SVGs mismatch:', svgs);

  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(500);
  const homeSvgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).map(s => {
      const rect = s.getBoundingClientRect();
      const parent = s.parentElement ? (s.parentElement.className || s.parentElement.tagName) : '';
      const outer = s.outerHTML.slice(0, 120);
      const vb = s.viewBox && s.viewBox.baseVal ? `${s.viewBox.baseVal.width}x${s.viewBox.baseVal.height}` : '';
      return { outer, parent, w: Math.round(rect.width), h: Math.round(rect.height), vb };
    }).filter(s => s.w > 0 && s.vb && Math.abs((s.w / s.h) - 1) > 0.05);
  });
  console.log('Home SVGs mismatch:', homeSvgs);

  await browser.close();
})();
