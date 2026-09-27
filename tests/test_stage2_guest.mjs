import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Stage 2 · Line counts before and after', () => {
  const files = [
    'src/pages/guest/Home.jsx',
    'src/pages/guest/Home.module.css',
    'src/pages/guest/About.jsx',
    'src/pages/guest/About.module.css',
    'src/pages/guest/Contact.jsx',
    'src/pages/guest/Contact.module.css',
  ];

  let totalLines = 0;
  const counts = {};

  for (const f of files) {
    const filePath = path.join(ROOT, f);
    assert.ok(fs.existsSync(filePath), `File exists: ${f}`);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
    counts[f] = lines;
    totalLines += lines;
  }

  // Before was 5,292 lines. Target is roughly a third (< 1,800).
  assert.ok(totalLines < 1800, `Total lines (${totalLines}) must be roughly a third of 5,292`);
  assert.ok(counts['src/pages/guest/Home.jsx'] < 300, 'Home.jsx lines reduced');
  assert.ok(counts['src/pages/guest/About.jsx'] < 150, 'About.jsx lines reduced');
  assert.ok(counts['src/pages/guest/Contact.jsx'] < 400, 'Contact.jsx lines reduced');
});

test('Stage 2 · CSS strict design token compliance (no hex, no raw px beyond 1px/0px, no forbidden styles)', () => {
  const cssFiles = [
    'src/pages/guest/Home.module.css',
    'src/pages/guest/About.module.css',
    'src/pages/guest/Contact.module.css',
  ];

  for (const f of cssFiles) {
    const content = fs.readFileSync(path.join(ROOT, f), 'utf8');

    // 1. Zero raw hex colors
    const hexMatches = content.match(/#[0-9a-fA-F]{3,8}/g);
    assert.equal(hexMatches, null, `${f} must contain zero raw hex colors`);

    // 2. Zero raw pixel declarations beyond 0px/1px (excluding media query breakpoints and -9999px honeypot)
    const rawPxLines = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@media')) return; // Media queries (480px, 768px, 1024px) are permitted breakpoints
      if (trimmed.includes('-9999px')) return; // Required honeypot position
      if (/:[^;\n]*\b(?!0px\b)(?!1px\b)\d+px/.test(trimmed)) {
        rawPxLines.push(`${idx + 1}: ${trimmed}`);
      }
    });
    assert.deepEqual(rawPxLines, [], `${f} must have zero raw px outside hairlines: ${rawPxLines.join('; ')}`);

    // 3. Zero forbidden styles (linear-gradient, radial-gradient, backdrop-filter, !important, :global)
    const forbiddenMatches = content.match(/linear-gradient|radial-gradient|backdrop-filter|!important|:global/g);
    assert.equal(forbiddenMatches, null, `${f} must not contain forbidden CSS rules`);
  }
});

test('Stage 2 · Accent budget compliance (two beet elements per screen)', () => {
  const homeCss = fs.readFileSync(path.join(ROOT, 'src/pages/guest/Home.module.css'), 'utf8');
  const contactCss = fs.readFileSync(path.join(ROOT, 'src/pages/guest/Contact.module.css'), 'utf8');
  const aboutCss = fs.readFileSync(path.join(ROOT, 'src/pages/guest/About.module.css'), 'utf8');

  // Home.module.css and Contact.module.css have 0 beet in CSS
  assert.equal(homeCss.includes('--color-beet'), false, 'Home.module.css has 0 beet tokens');
  assert.equal(homeCss.includes('--color-primary'), false, 'Home.module.css has 0 primary tokens');
  assert.equal(contactCss.includes('--color-beet'), false, 'Contact.module.css has 0 beet tokens');
  assert.equal(contactCss.includes('--color-primary'), false, 'Contact.module.css has 0 primary tokens');

  // About only has beet-tint for avatar background as explicitly required by prompt
  assert.ok(aboutCss.includes('--color-beet-tint'), 'About uses beet-tint for initials avatar');
  assert.equal(aboutCss.includes('var(--color-beet)'), false, 'About has zero beet accent');
});

test('Stage 2 · Copy audit (no payment, delivery, or verification claims)', () => {
  const files = [
    'src/pages/guest/Home.jsx',
    'src/pages/guest/About.jsx',
    'src/pages/guest/Contact.jsx',
  ];

  const violations = [];
  const pattern = /buy|purchase|checkout|payment|pay online|secure|deliver|shipping|courier|verified|certified|guarantee/i;

  for (const f of files) {
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!pattern.test(trimmed)) return;

      // The only permitted mentions are the negative constraint section on About and payment at the stall
      const isAllowedConstraint =
        f.endsWith('About.jsx') &&
        (trimmed.includes('No online payment — you pay at the stall') ||
         trimmed.includes('No delivery — collection at the market') ||
         trimmed.includes('Collection and payment happen at the stall'));

      if (!isAllowedConstraint) {
        violations.push(`${f}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  assert.deepEqual(violations, [], `Copy violations found: ${violations.join('; ')}`);
});

test('Stage 2 · Contact form API contract & honeypot', () => {
  const contactJsx = fs.readFileSync(path.join(ROOT, 'src/pages/guest/Contact.jsx'), 'utf8');

  // Check required field names matching backend
  assert.ok(contactJsx.includes('name="name"'), 'Contains name field');
  assert.ok(contactJsx.includes('name="email"'), 'Contains email field');
  assert.ok(contactJsx.includes('name="topic"'), 'Contains topic field');
  assert.ok(contactJsx.includes('name="message"'), 'Contains message field');
  assert.ok(contactJsx.includes('name="website"'), 'Contains honeypot field');

  // Check topics matching backend CONTACT_TOPICS: ['order', 'farmer-help', 'feedback', 'other']
  assert.ok(contactJsx.includes("value: 'order'"), 'Topic order present');
  assert.ok(contactJsx.includes("value: 'farmer-help'"), 'Topic farmer-help present');
  assert.ok(contactJsx.includes("value: 'feedback'"), 'Topic feedback present');
  assert.ok(contactJsx.includes("value: 'other'"), 'Topic other present');

  // Check 429 rate limit handling
  assert.ok(contactJsx.includes('Too many messages just now. Try again in a few minutes.'), 'Handles 429');

  // Check honeypot silent abort
  assert.ok(contactJsx.includes('honeypot'), 'Honeypot logic implemented');

  // Check success state replaces form
  assert.ok(contactJsx.includes('submittedEmail'), 'Success state replaces form');
});

test('Stage 2 · Human to-do markers (TEAM array and CONTACT_DETAILS)', () => {
  const aboutJsx = fs.readFileSync(path.join(ROOT, 'src/pages/guest/About.jsx'), 'utf8');
  const contactJsx = fs.readFileSync(path.join(ROOT, 'src/pages/guest/Contact.jsx'), 'utf8');

  assert.ok(aboutJsx.includes('export const TEAM ='), 'TEAM array exported in About.jsx');
  assert.ok(contactJsx.includes('export const CONTACT_DETAILS ='), 'CONTACT_DETAILS exported in Contact.jsx');
});

test('Stage 2 · Home resilience & parallel fetching', () => {
  const homeJsx = fs.readFileSync(path.join(ROOT, 'src/pages/guest/Home.jsx'), 'utf8');

  // Parallel fetch: Promise.allSettled
  assert.ok(homeJsx.includes('Promise.allSettled'), 'Home fetches in parallel, zero waterfall');

  // Retry state on backend down
  assert.ok(homeJsx.includes('Could not load the catalogue right now.'), 'Home has inline retry');
  assert.ok(homeJsx.includes('Try again'), 'Home has try again button');

  // Single canvas band
  assert.ok(homeJsx.includes('canvas={true}'), 'How it works uses single canvas band');

  // Step 3 cash at the stall honesty
  assert.ok(homeJsx.includes('Collect and pay at the stall'), 'Step 3 states collect and pay at the stall');
  assert.ok(homeJsx.includes('In person, in cash, on market day.'), 'Step 3 states cash in person');
});
