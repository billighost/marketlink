import { chromium } from 'playwright';

export const BASE_URL = process.env.MARKETLINK_URL || 'http://localhost:3000';
export const API_URL = process.env.API_URL || 'http://localhost:4000/api';

/**
 * Creates a browser and page context with error tracking
 */
export async function createTestContext(viewport = { width: 390, height: 844 }) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const uncaughtErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or expected network errors during deliberate error testing
      if (!text.includes('favicon.ico') && !text.includes('Socket') && !text.includes('React Router')) {
        consoleErrors.push(text);
        console.warn(`[Page Error Log]: ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    uncaughtErrors.push(err.message);
    console.error(`[Uncaught Page Error]: ${err.message}`);
  });

  return { browser, context, page, consoleErrors, uncaughtErrors };
}

/**
 * Signs in as Customer (George Adams) via the real UI
 */
export async function loginAsCustomer(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  
  await page.fill('input[type="email"]', 'george@example.com');
  await page.fill('input[type="password"]', 'market123');
  await page.click('button[type="submit"]');

  // Wait for redirect to /buyer
  await page.waitForURL('**/buyer**', { timeout: 20000 });
  await page.waitForLoadState('domcontentloaded');
}
