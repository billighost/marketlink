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
body { font-family: var(--font-body); background: #FAF7F0; padding: 20px 0; }
.footer {
  width: 100%;
  background: var(--color-canvas);
  border-top: 1px solid var(--color-border-warm);
}
.inner {
  padding: 1.25rem 1rem 1rem;
}
.brandLink { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.brandText { font-family: Georgia, serif; font-weight: bold; font-size: 1.15rem; }
.market { color: #5C1D2E; }
.linkText { color: #2E4A3B; }
.osmLink { color: inherit; text-decoration: underline; }
.colTitle {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink);
  margin-bottom: 0.5rem;
}
.linkList { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
.link {
  font-size: 0.8125rem;
  color: var(--color-ink-soft);
  text-decoration: none;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
}
.link:hover { color: var(--color-beet); }
${body.css}
</style>
</head>
<body>
${body.html}
</body>
</html>
  `;

  // Design F: 2x2 Grid (Col 1: Explore, Col 2: MarketLink, Col 3: Account, Col 4: Brand)
  const designF = {
    css: `
      .grid2x2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem 1rem;
      }
      .brandCol2x2 {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .brandTagline {
        font-size: 0.75rem;
        color: var(--color-ink-soft);
        line-height: 1.35;
      }
      .bottomBar {
        margin-top: 1.25rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding-right: 44px;
      }
    `,
    html: `
      <footer class="footer">
        <div class="inner">
          <div class="grid2x2">
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
                <li><a href="#" class="link">Sign up as a customer</a></li>
                <li><a href="#" class="link">Sell at a market</a></li>
              </ul>
            </div>
            <div class="brandCol2x2">
              <div class="brandLink">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
                <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
              </div>
              <p class="brandTagline">Reserve online. Collect and pay at the stall.</p>
            </div>
          </div>
          <div class="bottomBar">
            <span>© 2026 MarketLink. All rights reserved.</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap</a></span>
          </div>
        </div>
      </footer>
    `
  };

  // Design G: Brand Top Header + 3-Column Nav with responsive wrap + Bottom Bar
  const designG = {
    css: `
      .brandHeader {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-bottom: 0.85rem;
        margin-bottom: 0.85rem;
        border-bottom: 1px solid rgba(46, 43, 38, 0.08);
      }
      .brandTagline {
        font-size: 0.75rem;
        color: var(--color-ink-soft);
        line-height: 1.35;
      }
      .navGrid3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .bottomBar {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(46, 43, 38, 0.08);
        font-size: 0.6875rem;
        color: var(--color-ink-soft);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding-right: 44px;
      }
    `,
    html: `
      <footer class="footer">
        <div class="inner">
          <div class="brandHeader">
            <div class="brandLink">
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
              <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
            </div>
            <p class="brandTagline">Reserve online. Collect and pay at the stall.</p>
          </div>
          <div class="navGrid3">
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
                <li><a href="#" class="link">Sign up</a></li>
                <li><a href="#" class="link">Sell at stall</a></li>
              </ul>
            </div>
          </div>
          <div class="bottomBar">
            <span>© 2026 MarketLink. All rights reserved.</span>
            <span>Maps © <a href="#" class="osmLink">OpenStreetMap contributors</a></span>
          </div>
        </div>
      </footer>
    `
  };

  await page.setContent(wrap(designF));
  const fF = await page.locator('footer');
  console.log('Design F Height:', (await fF.boundingBox()).height);
  await fF.screenshot({ path: 'designF.png' });

  await page.setContent(wrap(designG));
  const fG = await page.locator('footer');
  console.log('Design G Height:', (await fG.boundingBox()).height);
  await fG.screenshot({ path: 'designG.png' });

  await browser.close();
})();
