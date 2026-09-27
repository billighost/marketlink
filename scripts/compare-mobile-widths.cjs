const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  const widths = [360, 390];
  
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 } });
    
    // HTML with 3 variants
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --color-canvas: #F5EFE3;
  --color-canvas-soft: #FAF7F0;
  --color-ink: #2E2B26;
  --color-ink-soft: #6B6259;
  --color-wood-line: #E3D3B8;
  --color-border-warm: #E3D3B8;
  --color-beet: #7A2E3B;
  --color-hairline: rgba(46, 43, 38, 0.10);
  --font-body: 'Inter', -apple-system, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background: #FAF7F0; padding: 10px; display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--color-canvas); border: 1px solid var(--color-border-warm); border-radius: 8px; overflow: hidden; }
.cardTitle { background: #5C1D2E; color: white; padding: 6px 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; }
.inner { padding: 1rem; }
.brandLink { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
.brandText { font-family: Georgia, serif; font-weight: bold; font-size: 1.15rem; }
.market { color: #5C1D2E; }
.linkText { color: #2E4A3B; }
.brandTagline { font-size: 0.75rem; color: var(--color-ink-soft); line-height: 1.35; margin-top: 0.25rem; }
.osmLink { color: inherit; text-decoration: underline; }
.bottomBar {
  margin-top: 0.85rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(46, 43, 38, 0.08);
  font-size: 0.6875rem;
  color: var(--color-ink-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Variant 1: 3-column with Top Brand */
.v1-brand { padding-bottom: 0.75rem; border-bottom: 1px solid rgba(46, 43, 38, 0.08); margin-bottom: 0.75rem; }
.v1-grid { display: grid; grid-template-columns: 1fr 1fr 1.25fr; gap: 0.5rem; }
.v1-colTitle { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink); margin-bottom: 0.4rem; }
.v1-list { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
.v1-link { font-size: 0.8125rem; color: var(--color-ink-soft); text-decoration: none; line-height: 1.25; }

/* Variant 2: 2x2 Grid (Brand in 4th quadrant) */
.v2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 0.75rem; }
.v2-colTitle { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink); margin-bottom: 0.4rem; }
.v2-list { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
.v2-link { font-size: 0.8125rem; color: var(--color-ink-soft); text-decoration: none; line-height: 1.25; }
.v2-brandCol { display: flex; flex-direction: column; gap: 0.25rem; justify-content: flex-start; }

/* Variant 3: Horizontal rows per category */
.v3-brand { padding-bottom: 0.65rem; border-bottom: 1px solid rgba(46, 43, 38, 0.08); margin-bottom: 0.65rem; }
.v3-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.v3-row { display: flex; align-items: baseline; gap: 0.5rem; }
.v3-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink); min-width: 68px; flex-shrink: 0; }
.v3-links { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.45rem; font-size: 0.8125rem; }
.v3-link { color: var(--color-ink-soft); text-decoration: none; }
.v3-dot { color: rgba(46,43,38,0.25); font-size: 0.7rem; }
</style>
</head>
<body>

<!-- Variant 1 -->
<div class="card">
  <div class="cardTitle">Variant 1: Top Brand + 3 Columns</div>
  <div class="inner">
    <div class="v1-brand">
      <div class="brandLink">
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
        <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
      </div>
      <p class="brandTagline">Reserve online. Collect and pay at the stall.</p>
    </div>
    <div class="v1-grid">
      <div>
        <h4 class="v1-colTitle">Explore</h4>
        <ul class="v1-list">
          <li><a href="#" class="v1-link">Markets</a></li>
          <li><a href="#" class="v1-link">Stalls</a></li>
          <li><a href="#" class="v1-link">Produce</a></li>
        </ul>
      </div>
      <div>
        <h4 class="v1-colTitle">MarketLink</h4>
        <ul class="v1-list">
          <li><a href="#" class="v1-link">About</a></li>
          <li><a href="#" class="v1-link">Contact</a></li>
          <li><a href="#" class="v1-link">How it works</a></li>
        </ul>
      </div>
      <div>
        <h4 class="v1-colTitle">Account</h4>
        <ul class="v1-list">
          <li><a href="#" class="v1-link">Sign in</a></li>
          <li><a href="#" class="v1-link">Sign up as a customer</a></li>
          <li><a href="#" class="v1-link">Sell at a market</a></li>
        </ul>
      </div>
    </div>
    <div class="bottomBar">
      <span>© 2026 MarketLink. All rights reserved.</span>
      <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
    </div>
  </div>
</div>

<!-- Variant 2 -->
<div class="card">
  <div class="cardTitle">Variant 2: 2x2 Grid (Brand bottom-right)</div>
  <div class="inner">
    <div class="v2-grid">
      <div>
        <h4 class="v2-colTitle">Explore</h4>
        <ul class="v2-list">
          <li><a href="#" class="v2-link">Markets</a></li>
          <li><a href="#" class="v2-link">Stalls</a></li>
          <li><a href="#" class="v2-link">Produce</a></li>
        </ul>
      </div>
      <div>
        <h4 class="v2-colTitle">MarketLink</h4>
        <ul class="v2-list">
          <li><a href="#" class="v2-link">About</a></li>
          <li><a href="#" class="v2-link">Contact</a></li>
          <li><a href="#" class="v2-link">How it works</a></li>
        </ul>
      </div>
      <div>
        <h4 class="v2-colTitle">Account</h4>
        <ul class="v2-list">
          <li><a href="#" class="v2-link">Sign in</a></li>
          <li><a href="#" class="v2-link">Sign up as a customer</a></li>
          <li><a href="#" class="v2-link">Sell at a market</a></li>
        </ul>
      </div>
      <div class="v2-brandCol">
        <div class="brandLink">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
          <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
        </div>
        <p class="brandTagline">Reserve online. Collect and pay at the stall.</p>
      </div>
    </div>
    <div class="bottomBar">
      <span>© 2026 MarketLink. All rights reserved.</span>
      <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
    </div>
  </div>
</div>

<!-- Variant 3 -->
<div class="card">
  <div class="cardTitle">Variant 3: Horizontal Inline Links</div>
  <div class="inner">
    <div class="v3-brand">
      <div class="brandLink">
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
        <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
      </div>
      <p class="brandTagline">Reserve online. Collect and pay at the stall.</p>
    </div>
    <div class="v3-rows">
      <div class="v3-row">
        <span class="v3-label">Explore</span>
        <div class="v3-links">
          <a href="#" class="v3-link">Markets</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">Stalls</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">Produce</a>
        </div>
      </div>
      <div class="v3-row">
        <span class="v3-label">MarketLink</span>
        <div class="v3-links">
          <a href="#" class="v3-link">About</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">Contact</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">How it works</a>
        </div>
      </div>
      <div class="v3-row">
        <span class="v3-label">Account</span>
        <div class="v3-links">
          <a href="#" class="v3-link">Sign in</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">Sign up as a customer</a>
          <span class="v3-dot">·</span>
          <a href="#" class="v3-link">Sell at a market</a>
        </div>
      </div>
    </div>
    <div class="bottomBar">
      <span>© 2026 MarketLink. All rights reserved.</span>
      <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
    </div>
  </div>
</div>

</body>
</html>
    `;

    await page.setContent(html);
    await page.screenshot({ path: `variants_${w}px.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
})();
