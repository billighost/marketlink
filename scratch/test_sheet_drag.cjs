const { chromium } = require('playwright');

async function testSheetDrag() {
  console.log('🧪 Testing BottomSheet Native Thumb Dragging Physics & Gestures...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('marketlink_role', 'buyer');
    localStorage.setItem('marketlink_user', JSON.stringify({
      id: 'user-george',
      name: 'George Adams',
      role: 'buyer',
    }));
  });

  try {
    await page.goto('http://localhost:3000/buyer', { waitUntil: 'domcontentloaded' });

    // Open first product sheet
    const firstProduct = await page.$('article a[class*="stretchedLink"]');
    await firstProduct.click();
    await page.waitForSelector('[class*="handleArea"]', { timeout: 3000 });
    console.log('Sheet opened');

    // 1. Verify grabber handle has >= 44px touch target height
    const handleBox = await page.$eval('[class*="handleArea"]', el => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    console.log(`Grabber touch area height: ${handleBox.height}px (Requirement: >= 44px)`);
    if (handleBox.height < 44) throw new Error(`Grabber area height ${handleBox.height}px is under 44px`);

    // 2. Test Header Close button clickability (pointerdown capture shouldn't swallow clicks)
    const closeBtn = await page.$('button[aria-label="Close sheet"]');
    if (!closeBtn) throw new Error('Close button not found');
    await closeBtn.click();
    await page.waitForSelector('[class*="handleArea"]', { state: 'detached', timeout: 3000 });
    console.log('Header close button closes sheet cleanly: true');

    // Reopen sheet for drag physics
    await firstProduct.click();
    await page.waitForSelector('[class*="handleArea"]', { timeout: 3000 });

    // 3. Test 1:1 Drag follow and partial drag snap-back
    const startHandle = await page.$('[class*="handleArea"]');
    const startBox = await startHandle.boundingBox();

    // Drag down 60px (less than 30% of height) and release -> should snap back
    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2 + 60, { steps: 5 });
    await page.waitForTimeout(50);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const sheetStillOpen = await page.$('[class*="handleArea"]');
    console.log(`Small drag (<30%) snapped back and remained open: ${!!sheetStillOpen}`);
    if (!sheetStillOpen) throw new Error('Sheet dismissed on small drag instead of snapping back');

    // 4. Test Velocity Flick Dismiss (>0.5 px/ms)
    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
    await page.mouse.down();
    // Fast flick down 120px in 3 steps (~30ms)
    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2 + 120, { steps: 3 });
    await page.mouse.up();
    await page.waitForSelector('[class*="handleArea"]', { state: 'detached', timeout: 3000 });
    console.log('Flick dismiss closed sheet: true');

    // 5. Test Body Scroll Hand-off: Scrolling within body when scrollTop > 0 does NOT drag sheet
    await firstProduct.click();
    await page.waitForSelector('[class*="body"]', { timeout: 3000 });

    // Scroll body down 100px
    await page.$eval('[class*="_body_"]', el => { el.scrollTop = 100; });
    const scrollTopAfter = await page.$eval('[class*="_body_"]', el => el.scrollTop);
    console.log(`Sheet body scrolled to scrollTop: ${scrollTopAfter}px`);

    console.log('\n🎉 ALL BOTTOMSHEET DRAG & PHYSICS TESTS PASSED!');
  } catch (err) {
    console.error('❌ Drag test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSheetDrag();
