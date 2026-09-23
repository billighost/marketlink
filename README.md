# MarketLink Frontend Foundation

> **"Farm Fresh Just a Click Away"**  
> A clean, calm, and minimal web platform connecting local farmers with neighborhood customers for in-person pickup pre-orders.

---

## 1. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs on Vite at `http://localhost:3000` (or the port specified in terminal).

---

## 2. Design System & CSS Architecture

This project is built using:
- **Light Theme Only** with white surfaces (`#FFFFFF`), market canvas (`#F5EFE3`), and purposeful accents in Beet (`#7A2E3B`), Herb (`#5C7048`), and Carrot (`#E07A2C`).
- **Idiqlat (Google Fonts)** serif at weight 400 for headings; **Inter** for UI & body.
- **CSS Modules (`*.module.css`)** paired with 3 global CSS files (`tokens.css`, `base.css`, `utils.css`).
- **Zero Tailwind, SCSS, or UI Kits**.

For complete rules, contrast ratios, and component usage, see:
👉 [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

---

## 3. Project Structure

```
marketlink-frontend/
├─ index.html                     (Google Fonts Idiqlat & Inter, viewport-fit=cover)
├─ package.json                   (React 18+, Vite, react-router-dom, lucide-react)
├─ vite.config.js                 (Alias "@" -> src)
├─ docs/
│  └─ DESIGN_SYSTEM.md            (Complete 16-section Design System specification)
├─ public/
│  └─ favicon.svg                 (MarketLink Beet sprout favicon)
└─ src/
   ├─ main.jsx                    (Entry point)
   ├─ App.jsx                     (Router & AuthProvider root)
   │
   ├─ styles/
   │  ├─ tokens.css               (CSS custom property tokens)
   │  ├─ base.css                 (Modern reset, typography defaults, reduced motion)
   │  ├─ utils.css                (Core global utility classes)
   │  └─ index.css                (Master CSS entry)
   │
   ├─ routes/
   │  ├─ paths.js                 (Route constants for guest, buyer, vendor, admin)
   │  ├─ ProtectedRoute.jsx       (Role guard)
   │  └─ AppRoutes.jsx            (Route definitions)
   │
   ├─ context/
   │  └─ AuthContext.jsx          (Role state management stub)
   │
   ├─ data/
   │  └─ placeholders.js          (Realistic local farmers market dummy data)
   ├─ hooks/
   │  └─ useDocumentTitle.js      (Document title helper)
   ├─ utils/
   │  └─ format.js                (Currency and date formatters)
   │
   ├─ layouts/                    (Outer layouts for each audience)
   │  ├─ GuestLayout.jsx + .module.css
   │  ├─ BuyerLayout.jsx + .module.css
   │  ├─ VendorLayout.jsx + .module.css
   │  └─ AdminLayout.jsx + .module.css
   │
   ├─ components/
   │  ├─ ui/                      (Reusable UI primitives: Button, Card, FormField...)
   │  ├─ layout/                  (Structural pieces: TopBar, Sidebar, PageHeader...)
   │  └─ domain/                  (Domain cards: ProductCard, MarketCard...)
   │
   └─ pages/
      ├─ guest/                   (Public unauthenticated routes: Home, About, Login...)
      ├─ buyer/                   (Customer persona routes)
      ├─ vendor/                  (Farmer persona routes)
      └─ admin/                   (Admin persona routes)
```

---

## 4. Role Switching & Previews

The `/login` screen provides convenient quick-switch buttons to test all roles:
- **Continue as Customer** (navigates to `/buyer`)
- **Continue as Farmer** (navigates to `/vendor`)
- **Continue as Admin** (navigates to `/admin`)
- **Sign Out** returns to the Guest public area.
