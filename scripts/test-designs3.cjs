const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const wrap = (body) => `
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
.card { background: var(--color-canvas); border: 1px solid var(--color-border-warm); border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(46,43,38,0.04); }
.cardTitle { background: #5C1D2E; color: white; padding: 6px 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; }
.inner { padding: 1.1rem 1rem 0.9rem; }
.brandLink { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
.brandText { font-family: Georgia, serif; font-weight: bold; font-size: 1.15rem; }
.market { color: #5C1D2E; }
.linkText { color: #2E4A3B; }
.osmLink { color: inherit; text-decoration: underline; text-underline-offset: 2px; }

${body.css}
</style>
</head>
<body>
${body.html}
</body>
</html>
  `;

  // Variant 4: Luxury Studio 3-Column with compact header and inline bottom
  const v4 = {
    css: `
      .v4-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
        border-bottom: 1px solid rgba(46, 43, 38, 0.08);
      }
      .v4-tagline {
        font-size: 0.7rem;
        color: var(--color-ink-soft);
        line-height: 1.25;
        text-align: right;
        max-width: 165px;
      }
      .v4-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1.25fr;
        gap: 0.5rem;
      }
      .v4-colTitle {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-ink);
        margin-bottom: 0.45rem;
      }
      .v4-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .v4-link {
        font-size: 0.8125rem;
        color: var(--color-ink-soft);
        text-decoration: none;
        line-height: 1.3;
        display: inline-flex;
        align-items: center;
        transition: color 0.15s ease;
      }
      .v4-link:hover { color: var(--color-beet); }
      .v4-bottom {
        margin-top: 0.85rem;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding-right: 48px; /* space for back to top */
      }
    `,
    html: `
      <div class="card">
        <div class="cardTitle">Variant 4: Top Row (Logo Left + Tagline Right) + 3 Columns</div>
        <div class="inner">
          <div class="v4-top">
            <div class="brandLink">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
              <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
            </div>
            <p class="v4-tagline">Reserve online. Collect and pay at the stall.</p>
          </div>
          <div class="v4-grid">
            <div>
              <h4 class="v4-colTitle">Explore</h4>
              <ul class="v4-list">
                <li><a href="#" class="v4-link">Markets</a></li>
                <li><a href="#" class="v4-link">Stalls</a></li>
                <li><a href="#" class="v4-link">Produce</a></li>
              </ul>
            </div>
            <div>
              <h4 class="v4-colTitle">MarketLink</h4>
              <ul class="v4-list">
                <li><a href="#" class="v4-link">About</a></li>
                <li><a href="#" class="v4-link">Contact</a></li>
                <li><a href="#" class="v4-link">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 class="v4-colTitle">Account</h4>
              <ul class="v4-list">
                <li><a href="#" class="v4-link">Sign in</a></li>
                <li><a href="#" class="v4-link">Sign up as a customer</a></li>
                <li><a href="#" class="v4-link">Sell at a market</a></li>
              </ul>
            </div>
          </div>
          <div class="v4-bottom">
            <span>© 2026 MarketLink. All rights reserved.</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
          </div>
        </div>
      </div>
    `
  };

  // Variant 5: 2 Columns (Explore & MarketLink) + Account Quick Strip
  const v5 = {
    css: `
      .v5-top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
        border-bottom: 1px solid rgba(46, 43, 38, 0.08);
      }
      .v5-tagline {
        font-size: 0.7rem;
        color: var(--color-ink-soft);
        text-align: right;
        max-width: 170px;
        line-height: 1.25;
      }
      .v5-grid2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
        margin-bottom: 0.85rem;
      }
      .v5-colTitle {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-ink);
        margin-bottom: 0.45rem;
      }
      .v5-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .v5-link {
        font-size: 0.8125rem;
        color: var(--color-ink-soft);
        text-decoration: none;
        line-height: 1.3;
      }
      .v5-link:hover { color: var(--color-beet); }
      .v5-account {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(46, 43, 38, 0.08);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
        font-size: 0.75rem;
      }
      .v5-accountLabel {
        font-weight: 700;
        color: var(--color-ink);
        text-transform: uppercase;
        font-size: 0.6875rem;
        letter-spacing: 0.05em;
      }
      .v5-accountLinks {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
      }
      .v5-accountLink {
        color: var(--color-ink-soft);
        text-decoration: none;
        font-weight: 500;
      }
      .v5-accountLink:hover { color: var(--color-beet); }
      .v5-dot { color: rgba(46, 43, 38, 0.3); font-size: 0.65rem; }
      .v5-bottom {
        margin-top: 0.75rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding-right: 48px;
      }
    `,
    html: `
      <div class="card">
        <div class="cardTitle">Variant 5: 2 Columns + Horizontal Account Bar</div>
        <div class="inner">
          <div class="v5-top">
            <div class="brandLink">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
              <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
            </div>
            <p class="v5-tagline">Reserve online. Collect and pay at the stall.</p>
          </div>
          <div class="v5-grid2">
            <div>
              <h4 class="v5-colTitle">Explore</h4>
              <ul class="v5-list">
                <li><a href="#" class="v5-link">Markets</a></li>
                <li><a href="#" class="v5-link">Stalls</a></li>
                <li><a href="#" class="v5-link">Produce</a></li>
              </ul>
            </div>
            <div>
              <h4 class="v5-colTitle">MarketLink</h4>
              <ul class="v5-list">
                <li><a href="#" class="v5-link">About</a></li>
                <li><a href="#" class="v5-link">Contact</a></li>
                <li><a href="#" class="v5-link">How it works</a></li>
              </ul>
            </div>
          </div>
          <div class="v5-account">
            <span class="v5-accountLabel">Account</span>
            <div class="v5-accountLinks">
              <a href="#" class="v5-accountLink">Sign in</a>
              <span class="v5-dot">·</span>
              <a href="#" class="v5-accountLink">Sign up as a customer</a>
              <span class="v5-dot">·</span>
              <a href="#" class="v5-accountLink">Sell at a market</a>
            </div>
          </div>
          <div class="v5-bottom">
            <span>© 2026 MarketLink. All rights reserved.</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
          </div>
        </div>
      </div>
    `
  };

  const fullHtml = wrap({ css: v4.css + v5.css, html: v4.html + v5.html });
  await page.setContent(fullHtml);
  await page.screenshot({ path: 'variants_4_and_5.png', fullPage: true });
  await browser.close();
})();
