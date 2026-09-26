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
marketlink/
├─ index.html                     (Google Fonts Idiqlat & Inter, viewport-fit=cover)
├─ package.json                   (React 18+, Vite, react-router-dom, lucide-react)
├─ vite.config.js                 (Alias "@" -> src, bundle splitting)
├─ docs/
│  └─ DESIGN_SYSTEM.md            (Complete Design System & Page-First specification)
├─ public/
│  └─ favicon.svg                 (MarketLink Beet sprout favicon)
├─ backend/                       (Node.js + Express 5 + native MongoDB API, port 4000)
│  ├─ src/                        (Server, routes, services, MongoDB connection)
│  ├─ docs/                       (DATABASE.md & API.md)
│  └─ README.md                   (Backend setup, schema & troubleshooting)
└─ src/
   ├─ main.jsx                    (Entry point)
   ├─ App.jsx                     (Router, Auth, Cart, Toast & Favorites root)
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
   │  └─ AppRoutes.jsx            (Page-first route definitions & redirects)
   │
   ├─ context/                    (AuthContext, CartContext, FavoritesContext, ToastContext)
   ├─ hooks/                      (useQuery, useFeed, useHotkey, useDocumentTitle...)
   ├─ utils/                      (format.js, sortStalls.js, greeting.js, time.js)
   │
   ├─ layouts/                    (Outer layouts for each audience)
   │  ├─ BuyerLayout.jsx          (White-first Customer frame with CommandPalette)
   │  ├─ GuestLayout.jsx          (Public visitor shell)
   │  ├─ VendorLayout.jsx         (Farmer management frame)
   │  └─ AdminLayout.jsx          (Platform operator dashboard)
   │
   ├─ components/
   │  ├─ ui/                      (Button, Card, EmptyState, ErrorState, Stars, Tabs...)
   │  ├─ layout/                  (Page, PageTitle, Section, MarketClock, BuyerTopBar, BottomNav...)
   │  └─ domain/                  (Scene system, ProductCard, FarmerCard, MarketCard, StallGroup...)
   │
   └─ pages/
      ├─ buyer/                   (19 Customer pages: Today, Browse, Produce, Stalls, Basket...)
      ├─ guest/                   (Public unauthenticated routes: Home, About, Login...)
      ├─ vendor/                  (Farmer persona routes)
      └─ admin/                   (Admin persona routes)
```

---

## 4. Customer (Buyer) Route Map

Every destination in the Customer workspace is a real, bookmarkable, refreshable page:

| Route Path | Page | Description |
|---|---|---|
| `/buyer` | Today at the Market | Live MarketClock, stall strip, curated local feed |
| `/buyer/products` | Browse Produce | Filter rail, category chips, cursor-based produce catalog |
| `/buyer/products/:id` | Produce Detail | Pricing per unit, stock availability, stall link, reviews |
| `/buyer/stalls` | Stalls Index | Active stalls sorted by open status and scarcity |
| `/buyer/stalls/:id` | Stall Detail | Stall operating days, pickup windows, weekly inventory |
| `/buyer/markets` | Markets Index | Nearby farmers markets with List and Map views |
| `/buyer/markets/:id` | Market Detail | Market hours, stall roster, interactive Leaflet map |
| `/buyer/basket` | Basket | Grouped by farm stall with cutoffs and pickup windows |
| `/buyer/checkout` | Review Pickup | Slot selection per stall, cash-at-stall reservation |
| `/buyer/orders` | Orders | Active & Past orders tabs with collection countdowns |
| `/buyer/orders/:id` | Order Detail | 4-letter collection code, progress timeline, market map |
| `/buyer/orders/:id/confirmed`| Confirmed | Order placed confirmation and collection instructions |
| `/buyer/saved` | Saved | Saved produce items, farm stalls, and markets |
| `/buyer/profile` | You (Account) | Customer overview and settings links |
| `/buyer/profile/details` | Personal Details | Name, phone number, and physical address |
| `/buyer/profile/markets` | Saved Markets | Home market configuration |
| `/buyer/profile/notifications`| Notifications | SMS & Email preference toggles |
| `/buyer/profile/reviews` | Your Reviews | Reviews left by the customer with edit actions |
| `/buyer/notifications` | Notifications Feed | Order status updates and restock alerts |
| `/buyer/assistant` | Ask MarketLink | Interactive local food and market assistant |
| `/buyer/help` | Help & FAQ | 4-step market collection guide & common questions |
| `/buyer/*` | Buyer 404 | Graceful not-found page with quick return action |

---

## 5. Seeded Credentials & Roles

The seeded database (`npm run seed` in `backend/`) provides demo accounts for all roles:

| Role | Email | Password | Primary Workspace |
|---|---|---|---|
| **Customer (Buyer)** | `george@example.com` | `market123` | `/buyer` |
| **Farmer (Vendor)** | `sarah@riverbend.farm` | `market123` | `/vendor` |
| **Platform Admin** | `admin@marketlink.local` | `market123` | `/admin` |

*Note: All market maps use **OpenStreetMap** with Leaflet. **No external API key is required.***

---

## 6. Running Both Services

### Terminal 1: Backend
```bash
cd backend
npm install
npm run seed      # Seeds database with realistic demo accounts and products
npm run dev       # Starts backend on http://localhost:4000/api
```

### Terminal 2: Frontend
```bash
npm install
npm run dev       # Starts Vite development server on http://localhost:3000
```

