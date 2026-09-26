# MarketLink Design System & Frontend Architecture Guide

> **Farm Fresh Just a Click Away**  
> Comprehensive Design System, CSS Architecture & Guidelines for MarketLink.

---

## 1. Purpose and Principles

MarketLink connects local farmers-market farmers with neighborhood customers for simple pre-orders and in-person pickup. The interface must feel **clean, elegant, calm, and super minimal**, enabling any user—from a multi-generational farmer in their 60s to a busy working parent—to navigate and place an order in seconds.

### The 10 Core Principles

1. **Mostly White (95% Base Surface)**: Pure `#FFFFFF` everywhere. "Market canvas" (`#F5EFE3`) appears exclusively in the footer, image placeholders, empty states, and at most one soft accent band per page. Full-page canvas backgrounds are prohibited.
2. **Colour is Rare and Meaningful**:
   - **Beet** (`#7A2E3B`): Primary action button, active navigation indicator, text links.
   - **Carrot** (`#E07A2C` / `#FCEADA` / `#9C4E14`): Low stock, cut-off warnings, attention badges only.
   - **Herb** (`#5C7048` / `#EAEFE2`): In-stock indicators and "Ready for pickup" confirmations only.
   - **Wood** (`#B08655`, `#E3D3B8`): Hairline dividers and structural borders only.
   - Gradients, decorative backgrounds, and gratuitous colored panels are strictly forbidden.
3. **Generous Whitespace**: No screen may feel congested. Single-column forms, breathing room (`--space-16`+ between major desktop sections), and a strict ceiling of **3 columns** on desktop, 2 on tablet, and 1 on mobile.
4. **One Primary Action Per Screen**: At any time, exactly one filled beet button (`.primary`) should be in the user's field of view. All other actions are secondary (outlined), subtle text links, or tertiary buttons.
5. **Plain, Human Language**: Sentence case across all screens. Buttons explicitly state the outcome ("Place pre-order", "Mark ready for pickup", "Save changes"), never generic terms ("Submit", "OK", "Proceed").
6. **Effortless Navigation**: Top navigation contains at most 5 items. Sidebars contain at most 6 items. The active route is always highlighted. Every sub-page provides a `PageHeader` with an accessible back link. Empty states always explain the immediate next step with one action.
7. **Structure Over Decoration**: Rely on whitespace and hairline borders (`1px solid var(--color-wood-line)`) to delineate sections. **Prefer borders over box-shadows**. Shadows appear only on floating overlays (dropdown menus, modals).
8. **Forgiving Touch Targets**: Clickable elements maintain a minimum hit area of `44x44px`. All inputs have a height of `44px` and a minimum font size of `16px` to prevent iOS zoom shifts.
9. **Zero Distractions**: No auto-advancing carousels, popups on initial load, marquee tickers, audio, or hover-lift card animations. Micro-motion is restricted to 120–200ms transitions responding directly to intentional user interactions.
10. **Responsive Table Integrity**: Tables must never squash or scroll awkwardly on mobile. Viewports below 768px transform table rows into stacked, individually labelled card rows (`data-label`).

---

## 2. Brand and Voice

### Tone of Voice
- **Warm, short, and grounded in local agriculture**: Friendly and direct without being overly colloquial or marketing-heavy.
- **Realistic terminology**: Use realistic local farm names (*Riverbend Farm*, *Oak & Mill Bakery*, *Hollow Creek Apiary*, *Elm Street Market*) and real pricing formats (*$4.50 / lb*, *$8.00 / boule*).
- **Naming Rule**: On screen, **always write "Customer" and "Farmer"**. Never refer to users on screen as "buyer" or "vendor".
- **Order Status Nomenclature**: Pre-order statuses shown to users are strictly:
  1. `Placed`
  2. `Accepted`
  3. `Ready for pickup`
  4. `Completed`
  5. `Cancelled`

### Sentence Case & Microcopy Guide

| Scenario | ❌ Prohibited Copy | ✅ MarketLink Approved Copy |
|---|---|---|
| Cart checkout | "SUBMIT ORDER" / "Checkout" | "Place pre-order" |
| Farmer order acceptance | "Approve" / "OK" | "Accept pre-order" |
| Ready notice | "Status: Finished" | "Mark ready for pickup" |
| Cancel order confirmation | "Delete" / "Yes" | "Cancel pre-order" |
| Product creation | "Submit Item" | "Publish product" |
| Generic confirmation | "Confirm & Proceed" | "Save changes" |

---

## 3. Colour Palette & Tokens

### The 60/30/10 Rule Adapted for MarketLink
- **~95% White & Canvas**: `#FFFFFF` dominates the UI canvas, with `#F5EFE3` reserved for footers, placeholders, and empty states.
- **~4% Ink & Hairlines**: `#2E2B26` for readable text, `#6B6259` for secondary text, `#E3D3B8` for hairline borders.
- **~1% Meaningful Colour**: Purposeful accents in Beet (`#7A2E3B`), Herb (`#5C7048`), and Carrot (`#E07A2C`).

### Complete Token Specification

| CSS Variable | Value | Role | Approved Uses | Never Use For |
|---|---|---|---|---|
| `--color-white` | `#FFFFFF` | Base surface | Page backgrounds, cards, modal dialogs, top bar | Text, decorative icons |
| `--color-canvas` | `#F5EFE3` | Soft canvas | Footer surface, empty state badges, image placeholders | Full-page background, cards |
| `--color-canvas-soft` | `#FAF7F0` | Subtle tint | Table row hover, selected row tint | General section backgrounds |
| `--color-ink` | `#2E2B26` | Chalkboard ink | Primary headings, body copy, active icons | Background surfaces |
| `--color-ink-soft` | `#6B6259` | Secondary ink | Subtitles, labels, timestamps, table headers | Low-contrast body copy |
| `--color-ink-faint` | `#9A9088` | Disabled ink | Input placeholders, disabled button states | Essential user information |
| `--color-wood` | `#B08655` | Accent wood | Empty state illustrations, rare branding marks | General body text, backgrounds |
| `--color-wood-line` | `#E3D3B8` | Structural line | Card borders, dividers, subtle separators | Text, active focus states |
| `--color-beet` | `#7A2E3B` | Beet root (primary) | Single primary button, active nav link, hyperlinked text | Card fills, large banners |
| `--color-beet-dark` | `#5E212B` | Beet hover | Hover/pressed state of primary beet button | General text |
| `--color-beet-tint` | `#F7EEF0` | Light beet tint | Active nav pill background, selected tab background | General page backgrounds |
| `--color-carrot` | `#E07A2C` | Carrot orange | Warning indicator dot, attention badge icon | Text on white (fails contrast) |
| `--color-carrot-bg` | `#FCEADA` | Carrot background | Warning badge background | Button backgrounds, large cards |
| `--color-carrot-text` | `#9C4E14` | Carrot text | Text inside warning badge (passes contrast) | General body text |
| `--color-herb` | `#5C7048` | Herb green | Success status dot, in-stock badge text | General background surfaces |
| `--color-herb-bg` | `#EAEFE2` | Herb background | In-stock and success badge background | General card surfaces |
| `--color-danger` | `#B3261E` | Destructive red | Destructive confirm buttons, error messages, cancel dots | Regular notifications |
| `--color-danger-bg` | `#FBEAE8` | Danger background | Danger badge background, error alert containers | General cards |

### Accessibility Contrast Audit (WCAG 2.1 AA)

| Text Color Token | Background Color Token | Contrast Ratio | WCAG Compliance |
|---|---|---|---|
| `--color-ink` (`#2E2B26`) | `--color-white` (`#FFFFFF`) | **13.8:1** | AAA (Pass) |
| `--color-ink-soft` (`#6B6259`) | `--color-white` (`#FFFFFF`) | **5.4:1** | AA (Pass) |
| `--color-on-primary` (`#FFF7F2`) | `--color-beet` (`#7A2E3B`) | **8.1:1** | AAA (Pass) |
| `--color-carrot-text` (`#9C4E14`) | `--color-carrot-bg` (`#FCEADA`) | **5.2:1** | AA (Pass) |
| `--color-herb` (`#5C7048`) | `--color-herb-bg` (`#EAEFE2`) | **4.8:1** | AA (Pass) |
| `--color-danger` (`#B3261E`) | `--color-danger-bg` (`#FBEAE8`) | **5.6:1** | AA (Pass) |
| `--color-border-input` (`#8F8579`)| `--color-white` (`#FFFFFF`) | **3.2:1** | UI Component (Pass) |

---

## 4. Typography

### Font Families
- **Headings**: `'Idiqlat', Georgia, 'Times New Roman', serif`.  
  *Rule*: Idiqlat only ships in weights 200, 300, and 400. **Weight 400 is used for every heading**. Browser faux-bold is strictly prohibited via `font-synthesis: none`. Never render Idiqlat below 18px.
- **Body & UI**: `'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif`.  
  Weights utilized: 400 (Regular body), 500 (Medium buttons, labels, tabs), 600 (Semibold prices, table headers).

### Full Type Scale

| Token | Size | Line Height | Weight | Typical Usage |
|---|---|---|---|---|
| `--text-display` | `clamp(2.5rem, 1.8rem + 3vw, 3.5rem)` | `1.1` | 400 (or 200/300) | Landing page hero heading only |
| `--text-h1` | `clamp(2rem, 1.6rem + 1.6vw, 2.5rem)` | `1.15` | 400 | PageHeader title (strictly one per page) |
| `--text-h2` | `clamp(1.5rem, 1.3rem + 0.8vw, 1.75rem)` | `1.2` | 400 | Section titles |
| `--text-h3` | `1.3125rem` (21px) | `1.3` | 400 | Card titles, modal headers, logo |
| `--text-h4` | `1.125rem` (18px) | `1.35` | 400 | Smallest Idiqlat size (sub-sections) |
| `--text-lead` | `1.125rem` (18px) | `1.7` | 400 | Hero introductory lead paragraphs |
| `--text-body` | `0.9375rem` (15px) | `1.7` | 400 | Standard body reading paragraphs |
| `--text-input` | `1rem` (16px) | `1.5` | 400 | Text inputs, selects, textareas |
| `--text-sm` | `0.8125rem` (13px) | `1.5` | 500 / 600 | Form labels, table headers, buttons, badges |
| `--text-xs` | `0.75rem` (12px) | `1.5` | 400 / 500 | Field error/hint text, legal notices |

### Measure (Reading Width)
- `--measure`: `62ch` (maximum comfortable line length for standard paragraphs).
- `--measure-narrow`: `46ch` (ideal for form intro text and compact lead-ins).

---

## 5. Spacing Scale

Based on a standard 4px baseline grid:

| Token | Rem | Px | Appropriate Application |
|---|---|---|---|
| `--space-1` | `0.25rem` | 4px | Fine alignment, badge padding, label required asterisk |
| `--space-2` | `0.5rem` | 8px | Button icon-text gap, form label to input gap (`--gap-tight`) |
| `--space-3` | `0.75rem` | 12px | Compact padding, modal button gaps |
| `--space-4` | `1rem` | 16px | Mobile page padding, default stack/cluster gap (`--gap-default`) |
| `--space-5` | `1.25rem` | 20px | Card internal padding (`--card-padding`) |
| `--space-6` | `1.5rem` | 24px | Grid gutters, loose element grouping (`--gap-loose`), tablet padding |
| `--space-8` | `2rem` | 32px | Sub-section spacing, desktop page padding |
| `--space-10` | `2.5rem` | 40px | Form fieldset vertical gaps |
| `--space-12` | `3rem` | 48px | Section gap on mobile (`--section-gap`) |
| `--space-16` | `4rem` | 64px | Section gap on desktop, major layout separation |
| `--space-20` | `5rem` | 80px | Hero section breathing space |
| `--space-24` | `6rem` | 96px | Large landing page breaks |

---

## 6. Radius, Borders and Shadows

### "Borders Over Shadows" Rule
Cards, tables, inputs, and layout frames **must use hairline borders (`--border`) and never box-shadows**. Shadows are reserved strictly for elevated, floating layers that sit on top of content (modals, dropdown menus).

| Token | Value | Purpose |
|---|---|---|
| `--radius-sm` | `5px` | Badges, small chips |
| `--radius-md` | `7px` | Buttons, form inputs, select controls |
| `--radius-lg` | `10px` | Cards, table frames, panels |
| `--radius-xl` | `14px` | Modal dialogs, hero callout panels |
| `--radius-full` | `999px` | Avatars, status dots, filter pills |
| `--border` | `1px solid var(--color-wood-line)` | Hairline border for cards, dividers, headers |
| `--border-input` | `1px solid #8F8579` | Accessible 3:1 contrast border for interactive inputs |
| `--shadow-none` | `none` | Default for cards and panels |
| `--shadow-menu` | `0 8px 24px rgba(46, 43, 38, 0.10)` | Floating account menu, context dropdowns |
| `--shadow-modal` | `0 16px 48px rgba(46, 43, 38, 0.16)` | Modal dialogs on top of backdrop |

---

## 7. Layout & Responsive Geometry

### Containers
- Main Content: `--container-max: 1120px;` (`.container`)
- Reading / Forms: `--container-narrow: 720px;` (`.containerNarrow`)
- Auth / Dialogs: `--container-form: 440px;`

### Breakpoints
Only the four literal media query breakpoints are permitted:
1. `480px`: Large mobile (cards expand, compact headers)
2. `768px`: Tablet (Sidebar becomes visible, table rows expand into tables)
3. `1024px`: Laptop (3-column grids activate, wider container padding)
4. `1280px`: Wide Desktop (maximum container width)

### Structural Dimensions
- Header height: `--header-height: 64px;`
- Sidebar width: `--sidebar-width: 248px;`
- Minimum touch target: `--tap-min: 44px;`
- Standard control height: `--control-h: 44px;`
- Compact control height: `--control-h-sm: 36px;`

---

## 8. Motion & Micro-interactions

- **Durations**: `--duration-fast: 120ms;` (color transitions, hover), `--duration-base: 200ms;` (drawer slide, modal fade).
- **Easing**: `--ease-standard: cubic-bezier(0.2, 0, 0, 1);`
- **Permitted**: Subtle button background hover darken, focus ring appearance, drawer slide-in, modal opacity fade.
- **Prohibited**: Bouncing, elastic effects, parallax scrolling, card hover elevation, auto-sliding banners.
- **Reduced Motion**: Mandatory `@media (prefers-reduced-motion: reduce)` block disables all animations immediately.

---

## 9. Shared Components Specification

### 1. `Button`
- **Purpose**: Interactive trigger for primary actions, navigation, or secondary tasks.
- **Props**: `variant` (`primary` | `secondary` | `text` | `danger`), `size` (`md` | `sm`), `as` (`button` | `Link` | `a`), `disabled`, `children`.
- **Do**: Use only ONE primary (beet) button per view.
- **Don't**: Use primary buttons for secondary actions like "Cancel" or "Back".
- **A11y**: Always maintains visible focus ring and minimum 44px touch height.

### 2. `FormField`
- **Purpose**: Accessible form input container wrapping label, control, hint, and error message.
- **Props**: `label`, `id`, `type`, `as` (`input` | `select` | `textarea`), `hint`, `error`, `required`.
- **Do**: Always provide an `id` so the label and `aria-describedby` connect correctly.
- **Don't**: Rely on placeholder text instead of an explicit label.
- **A11y**: When `error` is present, renders an `AlertCircle` icon alongside the danger text with `role="alert"`.

### 3. `Card`
- **Purpose**: White surface container for grouped information.
- **Props**: `as` (`div` | `article` | `section`), `padding` (`default` | `none`), `children`.
- **Do**: Group cohesive entity details (product summary, market details).
- **Don't**: Add box-shadows or hover-lift transforms.

### 4. `Badge`
- **Purpose**: Short status or tag chip (1–2 words).
- **Props**: `tone` (`neutral` | `success` | `warning` | `danger`), `children`.
- **Do**: Use `success` for "In stock" and `warning` for "Low stock".
- **Don't**: Place multi-sentence descriptions inside a badge.

### 5. `StatusDot`
- **Purpose**: Visual indicator and text label for pre-order states.
- **Props**: `label` (one of the 5 allowed statuses), `tone` (optional override).
- **Do**: Show on all order cards and order detail screens.

### 6. `Modal`
- **Purpose**: Confirmation and focus-trapped dialog for destructive or critical actions.
- **Props**: `open`, `title`, `onClose`, `confirmLabel`, `cancelLabel`, `onConfirm`, `tone`.
- **Do**: Include an explicit "Cancel" button and trap keyboard focus.
- **Don't**: Stack modals on top of each other.

### 7. `Table`
- **Purpose**: Tabular data presentation that converts into stacked cards on viewports `<768px`.
- **Props**: `columns` (`[{ key, header, align }]`), `rows` (`[{ id, ... }]`).
- **Do**: Provide `data-label` on cells for clear mobile readability.

### 8. `Tabs`
- **Purpose**: Switch between secondary views within a page.
- **Props**: `tabs` (`[{ id, label, count }]`), `active`, `onChange`.
- **Do**: Use the 2px beet underline indicator for the active tab.

### 9. `EmptyState`
- **Purpose**: Friendly guidance when no items or records exist.
- **Props**: `title`, `text`, `actionLabel`, `onAction`, `icon`.
- **Do**: Provide exactly one primary action button guiding the user what to do next.

### 10. `PageHeader`
- **Purpose**: Top landmark of every inner page, containing the single `h1`.
- **Props**: `title`, `subtitle`, `backTo`, `action`.
- **Do**: Place the page's single `h1` inside this component.

---

## 10. CSS Modules Conventions

### The 10 Mandatory Rules
1. **Co-location**: Every component/page has its companion `Name.module.css` in the exact same directory as `Name.jsx`.
2. **camelCase**: Class names use camelCase (`.cardTitle`, `.activeItem`).
3. **Zero Hardcoded Values**: All sizes, colors, spacing, and radii must use `var(--token)`. Only `0`, `1px`, `100%`, and `auto` are permitted as literals.
4. **Mobile-First**: Base declarations define mobile styles; wrap desktop enhancements in `@media (min-width: ...)`.
5. **Permitted Breakpoints**: Use only `480px`, `768px`, `1024px`, and `1280px`.
6. **No Selector Overreach**: Max 2 levels of descendant nesting. No ID selectors. No `!important` (except reduced motion).
7. **Minimal Composes**: Avoid complex CSS Module composition hierarchies.
8. **Plain Utilities**: Combine global utility classes (`.container`, `.stack`) as plain strings: `className={`${styles.card} stack`}`.
9. **Semantic Pseudo-Classes**: State styling must use `:hover`, `:focus-visible`, `:disabled`, and `[aria-current="page"]`.
10. **Keep Modules Concise**: Keep module files focused (under ~150 lines).

### Worked Example: `ProductCard`

```jsx
// src/components/domain/ProductCard.jsx
import React from 'react';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import styles from './ProductCard.module.css';

export function ProductCard({ product, onPreOrder }) {
  return (
    <Card padding="none" className={styles.productCard}>
      <div className={styles.imagePlaceholder} aria-hidden="true">
        <span>{product.category}</span>
      </div>
      <div className={`${styles.body} stack`}>
        <div className="rowBetween">
          <span className={styles.farmerName}>{product.farmerName}</span>
          {product.lowStock ? (
            <Badge tone="warning">Low stock</Badge>
          ) : (
            <Badge tone="success">In stock</Badge>
          )}
        </div>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.price}>
          {formatPrice(product.price)} <span className={styles.unit}>/ {product.unit}</span>
        </p>
        <Button variant="secondary" size="sm" onClick={() => onPreOrder?.(product)}>
          Pre-order
        </Button>
      </div>
    </Card>
  );
}
```

```css
/* src/components/domain/ProductCard.module.css */
.productCard {
  display: flex;
  flex-direction: column;
}

.imagePlaceholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--color-canvas);
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

.body {
  padding: var(--card-padding);
  gap: var(--space-2);
}

.farmerName {
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}

.productName {
  font-family: var(--font-head);
  font-size: var(--text-h4);
  font-weight: var(--weight-head);
  color: var(--color-ink);
}

.price {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}

.unit {
  font-weight: var(--weight-regular);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
```

---

## 11. Folder Structure & Placement Guide

```
marketlink-frontend/
├─ index.html                     Google Fonts, viewport-fit=cover, root element
├─ package.json                   Vite, React 18, React Router v6, Lucide React
├─ vite.config.js                 Alias "@" -> "src"
├─ README.md                      Installation, startup, role switcher guide
├─ docs/
│  └─ DESIGN_SYSTEM.md            The single source of truth design system
├─ public/
│  └─ favicon.svg                 Vector favicon
└─ src/
   ├─ main.jsx                    Mounts root, imports styles/index.css
   ├─ App.jsx                     Providers and top-level router wrapper
   ├─ styles/
   │  ├─ tokens.css               Raw design tokens in :root
   │  ├─ base.css                 CSS reset, element defaults, typography
   │  ├─ utils.css                Global helper classes (.container, .stack, etc.)
   │  └─ index.css                Master entry importing tokens, base, utils
   ├─ routes/
   │  ├─ paths.js                 Route string constants
   │  ├─ ProtectedRoute.jsx       Role check guard
   │  └─ AppRoutes.jsx            Master route definitions with layout outlets
   ├─ context/
   │  └─ AuthContext.jsx          Role state stub ('guest' | 'buyer' | 'vendor' | 'admin')
   ├─ data/
   │  └─ placeholders.js          Realistic dummy data for markets, farmers, products
   ├─ hooks/
   │  └─ useDocumentTitle.js      Document title setter hook
   ├─ utils/
   │  └─ format.js                Currency and date formatters
   ├─ layouts/                    Outer frame wrappers for each audience
   │  ├─ GuestLayout.jsx + .module.css
   │  ├─ BuyerLayout.jsx + .module.css
   │  ├─ VendorLayout.jsx + .module.css
   │  └─ AdminLayout.jsx + .module.css
   ├─ components/
   │  ├─ ui/                      Generic reusable primitives (Button, Card, FormField...)
   │  ├─ layout/                  Persistent structural pieces (TopBar, Sidebar, PageHeader...)
   │  └─ domain/                  MarketLink entity cards (ProductCard, MarketCard...)
   └─ pages/
      ├─ guest/                   Public unauthenticated routes
      ├─ buyer/                   Customer persona routes
      ├─ vendor/                  Farmer persona routes
      └─ admin/                   Admin management routes
```

### Where Does a File Go?
- **Used across 2 or more roles?** `src/components/ui/` or `src/components/domain/`.
- **A frame used for multiple pages in an audience?** `src/layouts/`.
- **Used by only one page?** Keep it inside that specific page's file.

---

## 12. Routing & Roles

### Route Architecture

| Route Pattern | Layout | Audience / Persona | Description |
|---|---|---|---|
| `/` | `GuestLayout` | Guest | Home landing page |
| `/about`, `/contact` | `GuestLayout` | Guest | Informational pages |
| `/login`, `/register` | `GuestLayout` | Guest | Authentication forms & role switcher |
| `/unauthorized` | `GuestLayout` | Guest | 403 access restricted |
| `/buyer/*` | `BuyerLayout` | Customer | Markets, Farmers, Products, Cart, Orders, Favorites |
| `/vendor/*` | `VendorLayout` | Farmer | Overview, Stock, Orders, Reviews, Insights, Stall |
| `/admin/*` | `AdminLayout` | Admin | Overview, People, Markets, Moderation, Settings |

### ProtectedRoute Workflow
`ProtectedRoute` queries `useAuth()`.
1. If `role === 'guest'`, user is redirected to `/login`.
2. If `role !== allowedRole`, user is redirected to `/unauthorized`.
3. If matches, `<Outlet />` renders smoothly.

---

## 13. Content & Placeholder Guidelines

- **Naming Conventions**: Use authentic names (*Riverbend Farm*, *Oak & Mill Bakery*, *Hollow Creek Apiary*, *Elm Street Market*).
- **Price Format**: USD with 2 decimal places: `$4.50 / lb`, `$12.00 / jar`.
- **Pickup Windows**: Clear time blocks: `Saturday 8:30 AM – 12:30 PM`.
- **Status Capitalization**: Sentence case only (`Ready for pickup`, `Completed`).

---

## 14. Accessibility Checklist

- [ ] **Contrast**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text and UI borders).
- [ ] **Focus Visible**: 2px Beet focus ring (`var(--focus-ring)`) appears on all keyboard-focused interactive items.
- [ ] **Landmarks**: Proper semantic tags used (`<header>`, `<nav>`, `<main id="main">`, `<footer>`).
- [ ] **Skip Link**: "Skip to main content" link is the first focusable element on every layout.
- [ ] **Icon Accessibility**: Icon-only buttons have descriptive `aria-label`; decorative icons have `aria-hidden="true"`.
- [ ] **Heading Structure**: Exactly one `<h1>` per page (inside `PageHeader`); headings never skip levels.
- [ ] **Mobile Touch**: Hit targets are minimum 44x44px; input text is 16px to prevent iOS scaling.
- [ ] **Motion**: Respects user's `prefers-reduced-motion` settings.

---

## 15. Do and Don't List

| Category | ✅ DO | ❌ DON'T |
|---|---|---|
| **Backgrounds** | Keep 95% of the page pure `#FFFFFF` | Don't use colored backgrounds for entire sections |
| **Buttons** | Have only ONE filled beet button in view at a time | Don't put multiple primary buttons next to each other |
| **Labels** | Use clear verbs: "Place pre-order", "Save changes" | Don't use generic words like "Submit" or "OK" |
| **Typography** | Use Idiqlat serif at weight 400 for headings | Don't use bold/700 or faux bold on Idiqlat |
| **Cards** | Use hairline borders (`1px solid var(--color-wood-line)`) | Don't add drop shadows to cards |
| **Terminology** | Write "Customer" and "Farmer" on screens | Don't write "buyer" or "vendor" on user interfaces |
| **Layout** | Keep grids to max 3 columns on desktop | Don't build 4-5 column dense grids |
| **Colors** | Use Carrot and Herb strictly for status/warnings | Don't use Carrot as decorative text on white |
| **Motion** | Use subtle 120ms transitions on hover/focus | Don't use bouncy animations, carousels, or popups |

---

## 16. Adding a New Page: 5-Step Checklist

1. **Create the files**: Create `PageName.jsx` and `PageName.module.css` in the appropriate `src/pages/<role>/` folder.
2. **Set the Document Title**: Call `useDocumentTitle('Page Name · MarketLink')` at the top of the component.
3. **Include the PageHeader**: Render `<PageHeader title="..." subtitle="..." backTo="..." />` inside a `<div className="container section">`.
4. **Style with Tokens**: Write styles in `PageName.module.css` using only `var(--token)` custom properties and global utility classes (`stack`, `grid3`, etc.).
5. **Register Route**: Add the path constant to `src/routes/paths.js` and register the `<Route>` in `src/routes/AppRoutes.jsx`.

---

## 17. Decoration: Waves and Illustrations

### WaveDivider System
- **Component**: `WaveDivider.jsx` renders static, inline SVG waves between `#FFFFFF` page surfaces and `#F5EFE3` canvas bands.
- **Tokens**:
  - `--wave-height: clamp(2rem, 1.4rem + 2.4vw, 4.5rem);` sets fluid wave height.
  - `--illus-stroke: 1.5px;` defines line weight for illustration outlines.
- **Rules**:
  - Waves are strictly static (zero animation, zero scroll trigger).
  - Path fill is set in CSS (`fill: var(--color-canvas)`), never in JSX.
  - `shape="soft"` and `shape="gentle"` provide gentle, rolling-hill curvature.
  - Sits flush against the canvas band with no visible seams (`margin-bottom: -1px` or flipped `margin-top: -1px`).
  - At most one canvas band per marketing page (Home, About, Contact). Error and auth pages use no bands.

### Line-and-Tint Illustrations
- **Component**: `Illustration.jsx` provides handcrafted inline SVGs (`stall`, `crate`, `carrot`, `beet`, `leaves`, `loaf`, `honey`, `tomato`, `basket`).
- **Style**:
  - Outlines: `stroke: var(--color-ink-soft); stroke-width: var(--illus-stroke); fill: none;`
  - Fills: Restricted exclusively to soft tints (`--color-carrot-bg`, `--color-herb-bg`, `--color-beet-tint`, `--color-canvas-soft`, `--color-white`).
  - Zero stock photos, zero remote images, zero emojis, zero hardcoded hex values in JSX.

### Wavy Underline (Once Per Site)
- Appears strictly once across the entire application: on the hero headline word **"ready"** on the Home page.
- Drawn with an inline SVG in `--color-wood` (stroke 1.5px, no fill, static).

### Top Bar Guest Actions
- To preserve the "One primary action per screen" rule:
  - "Sign in" renders as a text link.
  - "Get started" renders as a secondary (outlined) button.
  - The single filled primary beet button remains in the hero or page content.

---

## 18. Customer (Buyer) App Shell & Page-First Architecture

### Page-First Navigation Architecture
In the signed-in Customer experience, MarketLink is strictly **page-first**. Every primary destination is a distinct, shareable, refreshable URL with clean browser history and back-button behavior. The legacy sheet-first routing has been completely eliminated.

#### The Four-Part Test for Overlays
An overlay (modal dialog or bottom sheet) is legitimate in MarketLink ONLY if it satisfies all four criteria:
1. **Ephemeral Interaction**: It supports a temporary sub-task (e.g. tuning filter criteria or confirming a destructive action), not a primary destination.
2. **Not Shareable/Bookmarkable**: It does not represent an addressable resource that a user would send to someone else or bookmark.
3. **Focus Trapped & Restored**: It traps keyboard focus while active and safely returns focus to the triggering element upon `Esc` or dismissal.
4. **No Deep Flow**: It contains no nested routes, multi-step sub-navigation, or independent page flows.

#### The Five Surviving Overlays
1. **Filter BottomSheet** (`FilterPanel` on mobile `<1024px` for `/buyer/products`): Ephemeral filtering panel.
2. **Market Switcher** (`MarketDropdown` in top bar): Quick home market selector.
3. **Command Palette** (`CommandPalette`, triggered via `⌘K` / `Ctrl+K`): Instant search and keyboard navigation.
4. **Confirmation Dialogs** (`ConfirmStep`, order cancellation modal, sign-out modal): High-stakes action confirmation.
5. **Toast Notifications** (`ToastContext`): Floating confirmation notices.

#### The 19 Canonical Buyer Pages
| Path | Page Name | Width Variant | Density / Layout |
|---|---|---|---|
| `/buyer` | Today at the Market | `wide` | MarketClock + StallStrip + Curated Feed |
| `/buyer/products` | Browse Produce | `wide` | Filter rail (desktop) / BottomSheet (mobile) + Catalog grid |
| `/buyer/products/:id` | Produce Detail | `detail` | 2-column detail: Image illustration + Info/Order + Reviews |
| `/buyer/stalls` | Stalls Index | `wide` | Stalls grid sorted by open/scarcity |
| `/buyer/stalls/:id` | Stall Detail | `detail` | Stall header + DayDots + Operating schedule + Produce grid |
| `/buyer/markets` | Markets Index | `wide` | Segmented list/map view + Market cards |
| `/buyer/markets/:id` | Market Detail | `detail` | Market info + Stall list + Leaflet map with directions |
| `/buyer/basket` | Basket | `detail` | Multi-stall groups + Cutoff countdown + Pickup window summary |
| `/buyer/checkout` | Review Pickup | `detail` | Pickup window selector per stall + Cash at stall confirmation |
| `/buyer/orders` | Orders | `detail` | Active & Past segmented control + Order rows |
| `/buyer/orders/:id` | Order Detail | `detail` | 4-letter collection code + Status timeline + Location map |
| `/buyer/orders/:id/confirmed` | Order Confirmed | `detail` | Pickup code display + Stall instructions + Calendar action |
| `/buyer/saved` | Saved | `wide` | Tabs: Saved produce, stalls, and markets |
| `/buyer/profile` | You (Account) | `read` | Profile summary + Navigation links + Sign out |
| `/buyer/profile/details` | Personal Details | `read` | Name, contact phone, and collection address form |
| `/buyer/profile/markets` | Saved Markets | `read` | Primary market selection + Saved market list |
| `/buyer/profile/notifications` | Notification Preferences | `read` | SMS & Email preference toggles |
| `/buyer/profile/reviews` | Your Reviews | `read` | Editable user ratings and commentary |
| `/buyer/notifications` | Notifications Feed | `read` | Activity timeline with "Mark all as read" |
| `/buyer/assistant` | Ask MarketLink | `read` | Agricultural assistant chat with prompt chips |
| `/buyer/help` | How MarketLink Works | `read` | 4-step collection guide + FAQ accordions |
| `/buyer/*` | Buyer 404 | `read` | Lost path scene with return link |

---

## 18A. Full-Scene SVG Illustration System (`<Scene>`)
MarketLink features ten bespoke, handcrafted full-scene vector artworks designed specifically for local farmers market storytelling.

### Specification & Geometric Hierarchy
- **Canvas Dimensions**: `viewBox="0 0 640 400"`, aspect ratio 16:10.
- **Horizon Line**: Exactly at `y = 252` on all landscape and market scenes.
- **Layer Architecture (Bottom to Top)**:
  1. Sky / Background wash (`opacity="0.08"`)
  2. Distant treeline / hills (`opacity="0.18"`)
  3. Midground stall silhouettes (`opacity="0.35"`)
  4. Architectural canopy frames (`opacity="0.55"`)
  5. Stall counters and produce crates (`opacity="0.75"`)
  6. Foreground produce details (`opacity="0.95"`)
  7. Human silhouettes and market goers (`opacity="0.85"`)
  8. Architectural hairlines (`stroke="var(--color-wood-line)"`, 1px)
  9. Focus Accent element (Strictly ONE accent fill: Beet, Carrot, or Herb)
- **The One-Accent Rule**: Each artwork uses neutral monochrome ink layers with strictly ONE thematic accent color:
  - *Herb* (`#5C7048`): Fresh greens, morning produce, open markets.
  - *Carrot* (`#E07A2C`): Harvest root crates, sunset awnings, dusk.
  - *Beet* (`#7A2E3B`): Berry baskets, jam jars, signature marks.
- **The Ten Scene Artworks**:
  1. `market-morning`: Sunrise over market stalls, opening day (Used in Today feed header / welcome).
  2. `market-closed`: Stalls wrapped in canvas tarp under calm evening sky (Used when market is closed).
  3. `empty-basket`: Woven market basket sitting empty on wooden boards (Used in empty Basket).
  4. `order-placed`: Farmer packing fresh greens into brown paper bag (Used in Order Confirmation).
  5. `walk-to-market`: Customer walking along tree-lined avenue toward market gates (Used in search empty states).
  6. `farmer-packing`: Farmer hand-selecting heirloom produce at crate counter (Used in Order Timeline).
  7. `stall-at-dusk`: Warm twilight lanterns hung above rustic wooden stall frame (Used in late cutoff notices).
  8. `lost-path`: Quiet fork in rural farm road with stone milestone (Used in 404 Not Found & empty search).
  9. `kitchen-table`: Farm table with fresh herbs, knife, and cutting board (Used in empty Saved/Favorites).
  10. `harvest-crates`: Stacked cedar bushel crates filled with field crops (Used in Stalls/Reviews empty states).

---

## 18B. Two-Accent Budget & Enforcement
To maintain visual serenity and prevent UI noise, **no rendered screen may display more than two Beet (`var(--color-beet)`) elements simultaneously**.

### The Rule
- **First Beet Element**: The single primary action button (e.g., "Place pre-order", "Add to basket", "Save changes") OR the active navigation link.
- **Second Beet Element**: The active tab indicator or secondary emphasis pill.
- **Zero-Beet Screens**: Read-only inspection pages (e.g. Orders list, Today feed when browsing) feature zero or one accent only.

| Screen | Viewport | Beet Element 1 | Beet Element 2 | Total Beet |
|---|---|---|---|---|
| Today (`/buyer`) | 390 / 1440 | Active bottom nav "Market" | None (or search submit focus) | 1 |
| Browse (`/buyer/products`) | 390 / 1440 | Active bottom nav "Browse" | Filter count badge | 2 |
| Produce (`/buyer/products/:id`) | 390 / 1440 | "Add to basket" button | None | 1 |
| Stalls (`/buyer/stalls`) | 390 / 1440 | Active nav item | None | 1 |
| Stall (`/buyer/stalls/:id`) | 390 / 1440 | Active nav item | None | 1 |
| Markets (`/buyer/markets`) | 390 / 1440 | Active nav item | None | 1 |
| Market (`/buyer/markets/:id`) | 390 / 1440 | Active nav item | None | 1 |
| Basket (`/buyer/basket`) | 390 / 1440 | "Review pickup" primary CTA | Active bottom nav "Basket" | 2 |
| Checkout (`/buyer/checkout`) | 390 / 1440 | "Place pre-order" primary CTA | None | 1 |
| Orders (`/buyer/orders`) | 390 / 1440 | Active bottom nav "Orders" | None | 1 |
| Order Detail (`/buyer/orders/:id`)| 390 / 1440 | Active nav item | None | 1 |
| Confirmed (`/buyer/orders/:id/confirmed`) | 390 / 1440 | "View order" primary CTA | None | 1 |
| Saved (`/buyer/saved`) | 390 / 1440 | Active tab indicator | None | 1 |
| You (`/buyer/profile`) | 390 / 1440 | Active bottom nav "You" | None | 1 |
| Personal Details | 390 / 1440 | "Save changes" CTA | None | 1 |
| Saved Markets | 390 / 1440 | None | None | 0 |
| Notification Prefs | 390 / 1440 | None (Toggles use neutral ink) | None | 0 |
| Your Reviews | 390 / 1440 | None | None | 0 |
| Notifications | 390 / 1440 | "Mark all read" link | None | 1 |
| Ask MarketLink | 390 / 1440 | Send button | None | 1 |
| Help | 390 / 1440 | None | None | 0 |
| Buyer 404 | 390 / 1440 | "Return to market" CTA | None | 1 |

---

## 18C. Reusable Component Directory (Stages 1–9)
All Customer-facing pages build on the unified component set:

- **`<Page width="wide|detail|read">`**: Top-level page container with consistent padding and max-widths.
- **`<PageTitle title context backTo backLabel action>`**: Standardized `<h1>` header block in Idiqlat with optional back link and status metadata.
- **`<Section title subtitle action to>`**: Section heading block with standardized vertical rhythm (`--section-gap`).
- **`<MarketClock marketName openNow windowLabel nextOpenLabel closesAtLabel progress>`**: Live SVG market operating indicator with progress bar.
- **`<Scene name="market-morning|..." alt height>`**: Full-scene vector illustration renderer.
- **`<EmptyState scene title text actionLabel onAction actionTo>`**: Standard empty state block with scene illustration and single primary CTA.
- **`<ErrorState title text onRetry>`**: Standard error block with retry button.
- **`<FilterPanel value onChange onReset categories markets layout="rail|sheet">`**: Unified produce filter panel.
- **`<StallStrip marketId>`**: Horizontal scroll strip of operating farmer stalls.
- **`<StallGroup farmer items pickupWindows cutoffAt onRemove onQuantityChange>`**: Grouped cart display per farm stall.
- **`<DayDots days>`**: 7-day operating schedule indicator circles.
- **`<OrderTimeline events status>`**: Chronological order progress milestone tracker.
- **`<PickupCode code>`**: 4-letter collection code display tile with copy interaction.
- **`<CommandPalette>`**: `⌘K` spotlight modal for instant search and deep page linking.

---

## 19. Responsive Layout System, Density Budgets & Anti-Patterns

### 1. Responsive Layout System
- **Viewport Philosophy**: Mobile-first architecture tested continuously across 13 distinct viewport sizes: `320px`, `360px`, `390px`, `430px`, `600px`, `768px`, `820px`, `1024px`, `1180px`, `1280px`, `1440px`, `1920px`, and landscape mobile `844x390px`.
- **Container Max-Widths**:
  - Main app content: `--container-max: 1120px`
  - Reading / Narrow content: `--container-narrow: 720px`
  - Tablet centered content column: `--container-tablet: 40rem (640px)`
  - Authentication cards: `--container-form: 440px`
  - Modal sheets / Drawers: `--drawer-width: 28rem (448px)`
- **Column Budgets per Breakpoint**:
  - **Phone (< 768px)**: Strict 1-column layout for forms, feeds, and settings; 2 columns allowed exclusively for compact product grids.
  - **Tablet (768px – 1023px)**: Exactly 2 columns (or 3 columns for dense product catalogs). Centered 40rem column for forms and editorial feeds.
  - **Desktop (>= 1024px)**: Strict ceiling of 3 columns (or 4 columns in product catalogs). Never exceed 3 columns in dashboards or editorial content.

### 2. The Breakpoint Model
MarketLink enforces strictly four standard breakpoints across all media queries:
1. `@media (max-width: 479px)` / `@media (min-width: 480px)`:
   - Form inputs with accessory buttons (password toggle, filters) stack vertically on narrow phones (< 480px) and arrange horizontally on wider phones.
   - Order thumbnails and secondary metadata collapse on narrow mobile.
2. `@media (min-width: 768px)`:
   - Bottom sheets transition to right-side drawers (`--drawer-width: 28rem`) or centered modal dialogs.
   - Centered tablet column (`--container-tablet: 40rem`) prevents excessive line length on reading pages.
   - Multi-column grids activate (2-column layouts).
3. `@media (min-width: 1024px)`:
   - Mobile `BottomNav` completely hides (`display: none`).
   - Desktop header navigation in `BuyerTopBar` activates with all links guaranteed non-wrapping.
   - Horizontal scrolling rows display subtle chevron navigation buttons for pointer devices.
4. `@media (min-width: 1280px)`:
   - Full desktop canvas with generous outer margins (`--page-pad: var(--space-8)`).

### 3. The Bottom Stack Specification
When multiple fixed floating elements (bottom navigation, cart bar, and notification toasts) share the screen, they must never physically overlap.
- **Layering & Geometry**:
  - `BottomNav`: Fixed at bottom 0, height `--bottom-nav-height: 4rem (64px) + env(safe-area-inset-bottom)`. `z-index: var(--z-sticky)`. Visible below 1024px.
  - `CartBar`: Fixed floating pill above BottomNav. `bottom: calc(var(--bottom-nav-height) + var(--stack-gap) + env(safe-area-inset-bottom))`. `z-index: calc(var(--z-sticky) + 1)`.
  - `Toast`: Fixed floating notification bar. Positioned dynamically above the highest active bottom element: `bottom: calc(var(--stack-bottom) + var(--stack-gap))`. `z-index: var(--z-toast)`.
  - `Main Page Padding`: The page scroll area dynamically computes `padding-bottom: calc(var(--stack-bottom) + var(--space-6))` to ensure that the lowest in-flow item can always be scrolled fully into view above all fixed page chrome.
  - `Modal Sheet Isolation`: When a modal bottom sheet is open, `isSheetOpen: true` dynamically hides `BottomNav`, `CartBar`, and `BuyerTopBar`, preventing collision between sheet controls and background floating chrome.

### 4. Chip Row Rules
Filter and category chips provide focused filtering without visual clutter:
- **Single Row Rule**: There is strictly one chip row per screen. Chips must never wrap into multi-line rows that consume vertical screen space.
- **Scroll Behavior**: Horizontal bleed-to-edge container with `display: flex; gap: var(--space-2); overflow-x: auto; -webkit-overflow-scrolling: touch;`. Scrollbars are visually hidden.
- **Maximum Count**: At most 7 chips visible in the row: "All" + 5 top categories + "More" (which opens the comprehensive filter sheet).
- **Touch Target**: Every chip strictly meets `--tap-min: 44px` height (`min-height: var(--tap-min); display: inline-flex; align-items: center; justify-content: center;`).
- **Styling**: Inactive chips have a transparent background with hairline border (`1px solid var(--color-border)`). The active chip is filled with primary Beet (`var(--color-beet)`) and white text.

### 5. Density Budget at 390x844 (First Viewport)
Every primary screen is engineered to present exactly one clear focus with zero congestion in the first 844px viewport:
1. **Home Feed**:
   - Header: Brand mark + Market selector dropdown (56px).
   - Hero greeting: Time-of-day greeting ("Good morning, George") + Saturday market countdown badge.
   - First content: Exactly 1 featured harvest card and 2 compact items visible.
2. **Products / Browse**:
   - Sticky Header: Single search input with integrated "Filters" text button (44px) + 1 category chip row (44px).
   - Summary line: Total product count (e.g., "9 products").
   - Results: First 4 product cards in clean 2-column grid.
3. **Orders**:
   - Market collection info: Next pickup reminder bar.
   - Segmented control: Active (count) vs Past orders (44px target).
   - Order items: First 2 active order cards with clear status badges and collection stall highlights.
4. **Cart Sheet**:
   - Header: Grab handle + Close button.
   - Market notice: Collection location and Saturday pickup window.
   - Items: 2 to 3 cart items with accessible 44px quantity steppers and delete actions.
   - Footer: Sticky checkout footer with order total and primary "Place pre-order" button.
5. **Product Sheet**:
   - Visual: 4/3 ratio product illustration container.
   - Information: Product name, price per unit, stock status badge, and farmer stall link.
   - Footer: Sticky 44px action bar with price and "Add to cart" button.
6. **Profile / Settings**:
   - Header: User name, email, and market affiliation.
   - Toggles: 4 accessible preference rows (Email notifications, SMS updates, Reduced motion, Dark canvas) with 44px touch areas and instant "Saved" indicators.

### 6. Anti-Patterns Catalog (Prohibited Design Patterns)
The following patterns are strictly forbidden as they directly cause responsiveness breakage, congestion, and element overlap:
1. **Fixed Page Chrome Without Matching Body Padding**: Never position an element with `position: fixed` or `position: sticky` at the bottom or top of the viewport without adding a matching computed `padding-bottom` or `padding-top` to the main scroll container.
2. **Stretched Links Covering Secondary Actions**: Never place a `.stretchedLink` (`::after { inset: 0 }`) over a card container that also contains secondary buttons (e.g. `AddToCartButton` or favorite heart buttons). The link must be bounded to the card header/image area or use semantic markup without full-card overlay pseudo-elements.
3. **Multi-line Filter Chip Wrapping**: Never allow chips to wrap onto 2 or 3 lines. Always use horizontal scrolling or move secondary filters into a dedicated filter sheet.
4. **Unconstrained Image and Media Dimensions**: Never render `<img>` or `<svg>` without explicit aspect ratios (`data-aspect="4/3"` or CSS `aspect-ratio: 4/3`) and `object-fit: cover`. Never allow flex containers to shrink SVGs non-uniformly.
5. **Sub-44px Interactive Touch Targets**: Never render an icon button, link, tab, or chip with `height` or `width` less than `44px` (`var(--tap-min)`). For small visual icons (e.g., 20px close cross or heart), pad the outer hit area to at least 44x44px.
6. **Background Interaction During Modal Sheets**: When a modal sheet or dialog is open, the background app root MUST have `inert` applied, and underlying page chrome (such as top navigation or floating bars) must be occluded or hidden to prevent overlapping click traps.
7. **Decorative Gradients & Heavy Shadows**: Never use CSS linear gradients, radial gradients, or heavy multi-layer box shadows. Use hairline borders (`1px solid var(--color-border)`) and generous whitespace for calm, elegant visual hierarchy.


