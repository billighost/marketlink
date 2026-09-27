const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const template = (body) => `
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
  --font-body: 'Inter', -apple-system, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background: #FAF7F0; padding: 20px 0; }
.footer {
  width: 100%;
  background: var(--color-canvas);
  border-top: 1px solid var(--color-border-warm);
}
.inner {
  padding: 1.1rem 1rem 0.9rem;
}
.brandLink { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.brandText { font-family: Georgia, serif; font-weight: bold; font-size: 1.15rem; }
.market { color: #5C1D2E; }
.linkText { color: #2E4A3B; }
.tagline {
  font-size: 0.75rem;
  color: var(--color-ink-soft);
  line-height: 1.3;
}
.osmLink { color: inherit; text-decoration: underline; }
${body.css}
</style>
</head>
<body>
${body.html}
</body>
</html>
  `;

  // Option D: Inline row per category (horizontal links side by side with dividers)
  const optD = {
    css: `
      .brandArea {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-bottom: 0.85rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(46, 43, 38, 0.08);
      }
      .sections {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .sectionRow {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
        font-size: 0.8125rem;
      }
      .secLabel {
        font-weight: 700;
        font-size: 0.75rem;
        color: var(--color-ink);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        min-width: 78px;
        flex-shrink: 0;
      }
      .linksInline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem 0.5rem;
      }
      .link {
        color: var(--color-ink-soft);
        text-decoration: none;
        white-space: nowrap;
      }
      .link:hover { color: var(--color-beet); }
      .sep { color: rgba(46,43,38,0.25); font-size: 0.7rem; }
      .bottomBar {
        margin-top: 0.85rem;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `,
    html: `
      <footer class="footer">
        <div class="inner">
          <div class="brandArea">
            <div class="brandLink">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
              <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
            </div>
            <p class="tagline">Reserve online. Collect and pay at the stall.</p>
          </div>
          <div class="sections">
            <div class="sectionRow">
              <span class="secLabel">Explore</span>
              <div class="linksInline">
                <a href="#" class="link">Markets</a>
                <span class="sep">·</span>
                <a href="#" class="link">Stalls</a>
                <span class="sep">·</span>
                <a href="#" class="link">Produce</a>
              </div>
            </div>
            <div class="sectionRow">
              <span class="secLabel">About</span>
              <div class="linksInline">
                <a href="#" class="link">About Us</a>
                <span class="sep">·</span>
                <a href="#" class="link">Contact</a>
                <span class="sep">·</span>
                <a href="#" class="link">How it works</a>
              </div>
            </div>
            <div class="sectionRow">
              <span class="secLabel">Account</span>
              <div class="linksInline">
                <a href="#" class="link">Sign in</a>
                <span class="sep">·</span>
                <a href="#" class="link">Sign up</a>
                <span class="sep">·</span>
                <a href="#" class="link">Sell at a market</a>
              </div>
            </div>
          </div>
          <div class="bottomBar">
            <span>© 2026 MarketLink</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap</a></span>
          </div>
        </div>
      </footer>
    `
  };

  // Option E: Combined Brand Top Header with Tagline beside logo, then 3 compact columns, then subtle bottom
  const optE = {
    css: `
      .brandArea {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.85rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(46, 43, 38, 0.08);
      }
      .brandArea p {
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        text-align: right;
        max-width: 170px;
        line-height: 1.25;
      }
      .columnsGrid {
        display: grid;
        grid-template-columns: 1fr 1fr 1.15fr;
        gap: 0.5rem;
      }
      .colTitle {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-ink);
        margin-bottom: 0.45rem;
      }
      .linkList { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
      .link {
        font-size: 0.8125rem;
        color: var(--color-ink-soft);
        text-decoration: none;
        line-height: 1.35;
        padding: 2px 0;
      }
      .link:hover { color: var(--color-beet); }
      .bottomBar {
        margin-top: 0.85rem;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 44px; /* Avoid floating backToTop */
      }
    `,
    html: `
      <footer class="footer">
        <div class="inner">
          <div class="brandArea">
            <div class="brandLink">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
              <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
            </div>
            <p>Reserve online. Collect and pay at the stall.</p>
          </div>
          <div class="columnsGrid">
            <div>
              <h4 class="colTitle">Explore</h4>
              <ul class="linkList">
                <li><a href="#" class="link">Markets</a></li>
                <li><a href="#" class="link">Stalls</a></li>
                <li><a href="#" class="link">Produce</a></li>
              </ul>
            </div>
            <div>
              <h4 class="colTitle">MarketLink</h4>
              <ul class="linkList">
                <li><a href="#" class="link">About</a></li>
                <li><a href="#" class="link">Contact</a></li>
                <li><a href="#" class="link">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 class="colTitle">Account</h4>
              <ul class="linkList">
                <li><a href="#" class="link">Sign in</a></li>
                <li><a href="#" class="link">Customer sign-up</a></li>
                <li><a href="#" class="link">Sell at a market</a></li>
              </ul>
            </div>
          </div>
          <div class="bottomBar">
            <span>© 2026 MarketLink</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap</a></span>
          </div>
        </div>
      </footer>
    `
  };

  await page.setContent(template(optD));
  const fD = await page.locator('footer');
  console.log('OptD Height:', (await fD.boundingBox()).height);
  await fD.screenshot({ path: 'optD.png' });

  await page.setContent(template(optE));
  const fE = await page.locator('footer');
  console.log('OptE Height:', (await fE.boundingBox()).height);
  await fE.screenshot({ path: 'optE.png' });

  await browser.close();
})();
