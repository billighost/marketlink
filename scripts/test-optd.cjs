const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  const testHtml = `
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
  --container-max: 1400px;
  --page-pad: 1rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --weight-bold: 700;
  --duration-fast: 120ms;
  --ease-standard: cubic-bezier(0.2, 0, 1);
  --focus-ring: 2px solid #7A2E3B;
  --focus-offset: 2px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background: #FAF7F0; margin: 0; }

.footer {
  margin-top: auto;
  width: 100%;
  background: var(--color-canvas);
  border-top: 1px solid var(--color-border-warm);
}

.inner {
  width: min(100%, var(--container-max));
  margin-inline: auto;
  padding-inline: var(--page-pad);
}

/* =========================================================
   Mobile-first: Compact Option D Layout
   ========================================================= */
.content {
  display: flex;
  flex-direction: column;
  padding-top: var(--space-4);
  padding-bottom: var(--space-3);
  gap: var(--space-3);
}

/* Brand area */
.brandCol {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-hairline);
}

.brandLink {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.brandLink:hover { opacity: 0.85; }
.brandLink:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }

.brandText { font-family: Georgia, serif; font-weight: bold; font-size: 1.15rem; }
.market { color: #5C1D2E; }
.linkText { color: #2E4A3B; }

.productLine {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
  line-height: 1.35;
}

/* Nav sections */
.navSections {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sectionRow {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.sectionTitle {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink);
  margin: 0;
  min-width: 76px;
  flex-shrink: 0;
}

.linkList {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dot {
  color: var(--color-hairline);
  font-size: 0.75rem;
  user-select: none;
  line-height: 1;
}

.link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  text-decoration: none;
  padding: 2px 0;
  display: inline-flex;
  align-items: center;
  transition: color var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
}
.link:hover { color: var(--color-beet); }
.link:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }

/* Bottom bar */
.bottom {
  border-top: 1px solid var(--color-hairline);
  padding-block: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  padding-right: 48px; /* Safe area for floating BackToTop button */
}

.copyright {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

.osmAttribution {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

.osmLink {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--duration-fast) var(--ease-standard);
}
.osmLink:hover { color: var(--color-beet); }

/* =========================================================
   Tablet & Desktop Breakpoint Adaptation (>= 768px)
   ========================================================= */
@media (min-width: 768px) {
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1.5fr;
    gap: var(--space-6);
    padding-block: var(--space-8) var(--space-6);
  }

  .navSections {
    display: contents;
  }

  .sectionRow {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .sectionTitle {
    font-size: var(--text-sm);
    text-transform: none;
    letter-spacing: normal;
    min-width: unset;
  }

  .linkList {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .dot {
    display: none;
  }

  .link {
    min-height: 36px;
    white-space: normal;
  }

  .brandCol {
    order: 4;
    padding-bottom: 0;
    border-bottom: none;
    gap: var(--space-3);
  }

  .productLine {
    font-size: var(--text-sm);
    line-height: 1.6;
    max-width: 46ch;
  }

  .bottom {
    border-top: 1px solid var(--color-border-warm);
    padding-block: var(--space-4);
    padding-right: 0;
  }
}
</style>
</head>
<body>
<footer class="footer">
  <div class="inner">
    <div class="content">
      <div class="brandCol">
        <a href="#" class="brandLink" aria-label="MarketLink home">
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none"><path d="M23.2 38.8 C21.5 34.5 13.8 28.2 12.2 21.6 C10.8 15.8 14.5 11.2 20.8 13.4 C25.8 15.2 26.2 24.8 23.2 38.8 Z" fill="#3E5844"/><path d="M24.8 38.8 C26.8 33.2 32.5 22.8 37.6 16.5 C42.2 10.8 47.5 13.2 46.2 20.1 C44.5 28.6 34.5 35.8 24.8 38.8 Z" fill="#3E5844"/><path d="M22.5 37.5 C23.5 41.5 24 43 24 43 C24 43 24.5 41.5 25.5 37.5 Z" fill="#3E5844"/></svg>
          <span class="brandText"><span class="market">Market</span><span class="linkText">Link</span></span>
        </a>
        <p class="productLine">
          Reserve online. Collect and pay at the stall.
        </p>
      </div>

      <div class="navSections">
        <!-- Explore -->
        <div class="sectionRow">
          <h2 class="sectionTitle">Explore</h2>
          <ul class="linkList" role="list">
            <li><a href="#" class="link">Markets</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">Stalls</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">Produce</a></li>
          </ul>
        </div>

        <!-- MarketLink -->
        <div class="sectionRow">
          <h2 class="sectionTitle">MarketLink</h2>
          <ul class="linkList" role="list">
            <li><a href="#" class="link">About</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">Contact</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">How it works</a></li>
          </ul>
        </div>

        <!-- Account -->
        <div class="sectionRow">
          <h2 class="sectionTitle">Account</h2>
          <ul class="linkList" role="list">
            <li><a href="#" class="link">Sign in</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">Sign up as a customer</a></li>
            <li class="dot" aria-hidden="true">·</li>
            <li><a href="#" class="link">Sell at a market</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="bottom">
      <p class="copyright">
        © 2026 MarketLink. All rights reserved.
      </p>
      <p class="osmAttribution">
        Maps © <a href="https://www.openstreetmap.org/copyright" class="osmLink" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>
      </p>
    </div>
  </div>
</footer>
</body>
</html>
  `;

  const viewports = [
    { name: 'mobile_360', width: 360, height: 600 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'tablet_768', width: 768, height: 800 },
    { name: 'desktop_1280', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.setContent(testHtml);
    const f = await page.locator('footer');
    const box = await f.boundingBox();
    console.log(`${vp.name} (${vp.width}px): Height = ${box.height}px`);
    await f.screenshot({ path: `optD_${vp.name}.png` });
    await page.close();
  }

  await browser.close();
})();
