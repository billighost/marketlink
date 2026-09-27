# Catalogue sharing strategy — Stage G1

Written by Stage 1 as a design document. Stage 3 executes it.

---

## 1. The six shared view components

| Component | File | Replaces (guest) | Replaces (buyer) |
|---|---|---|---|
| `MarketsView` | `src/components/catalogue/MarketsView.jsx` | `src/pages/guest/Market.jsx` (617+1416 lines) | `src/pages/buyer/Markets.jsx` |
| `MarketView` | `src/components/catalogue/MarketView.jsx` | `src/pages/guest/MarketDetail.jsx` (1062+1572) | `src/pages/buyer/MarketDetail.jsx` |
| `StallsView` | `src/components/catalogue/StallsView.jsx` | `src/pages/guest/Farmers.jsx` (897+1339) | `src/pages/buyer/Farmers.jsx` |
| `StallView` | `src/components/catalogue/StallView.jsx` | `src/pages/guest/FarmerDetail.jsx` (564+923) | `src/pages/buyer/FarmerDetail.jsx` |
| `BrowseView` | `src/components/catalogue/BrowseView.jsx` | `src/pages/guest/Products.jsx` (509+845) | `src/pages/buyer/Products.jsx` |
| `ProduceView` | `src/components/catalogue/ProduceView.jsx` | `src/pages/guest/ProductDetail.jsx` (871+1298) | `src/pages/buyer/ProductDetail.jsx` |

Each view component signature:

```jsx
/**
 * @param {'guest'|'buyer'} audience  Changes actions and link targets; never content.
 */
export function ProduceView({ audience = 'guest' }) {}
```

---

## 2. The audience fork table

| Element | guest | buyer |
|---|---|---|
| Add-to-basket | `<Link to="/login?next=...">Sign in to reserve</Link>` | `<AddToCartButton>` |
| Favourite / save | `<Link to="/login?next=...">Sign in to save</Link>` | `<FavouriteButton>` |
| Pickup window picker | Read-only list | Interactive slot selector |
| Basket pill | Hidden | Shown in top bar |
| "Ask MarketLink" | Hidden | Shown on produce page |
| Produce link target | `/products/:id` | `/buyer/products/:id` |
| Stall link target | `/farmers/:id` | `/buyer/stalls/:id` |
| Market link target | `/markets/:id` | `/buyer/markets/:id` |
| Browse link | `/products` | `/buyer/products` |

Rule: audience changes actions and link targets. It never changes content.

---

## 3. The CATALOGUE_ROUTES map

```js
// src/components/catalogue/routes.js
export const CATALOGUE_ROUTES = {
  guest: {
    produce:  (id) => `/products/${id}`,
    stall:    (id) => `/farmers/${id}`,
    market:   (id) => `/markets/${id}`,
    browse:   '/products',
    stalls:   '/farmers',
    markets:  '/markets',
  },
  buyer: {
    produce:  (id) => `/buyer/products/${id}`,
    stall:    (id) => `/buyer/stalls/${id}`,
    market:   (id) => `/buyer/markets/${id}`,
    browse:   '/buyer/products',
    stalls:   '/buyer/stalls',
    markets:  '/buyer/markets',
  },
};
```

---

## 4. Public vs authenticated field diff

Both /api/public/products/:id and /api/products/:id return identical top-level keys.
All catalogue fields (name, price, unit, stock, description, art, imageUrl, category, farmer, market) are present on the public mirror.

Clock object on /api/public/markets/:id: present - same { status, nextOpen, message } shape.

Pagination: public list endpoints return { data: [...], meta: { total, page, nextCursor, hasMore } } - same as authenticated.

---

## 5. Auth error vocabulary

| Case | error.code | error.message |
|---|---|---|
| Wrong password | INVALID_CREDENTIALS | Invalid email or password |
| Duplicate email | EMAIL_EXISTS | An account with this email already exists |
| Unverified email | EMAIL_NOT_VERIFIED | Please verify your email before logging in |
| Expired reset token | TOKEN_EXPIRED | Reset link has expired. Please request a new one. |
| Used verify token | TOKEN_USED | This verification link has already been used. |
| Rate limited | RATE_LIMITED | Too many attempts. Please try again in {X} minutes. |

---

## 6. Rate limits

| Route | Limit |
|---|---|
| POST /api/auth/login | 10 req / 15 min per IP |
| POST /api/auth/register/* | 5 req / hour per IP |
| POST /api/auth/forgot-password | 3 req / hour per IP |
| POST /api/contact | 5 req / hour per IP |

---

## 7. Guest vs buyer ProductDetail diff

Premise verified by diffing src/pages/guest/ProductDetail.jsx (871 lines) vs src/pages/buyer/ProductDetail.jsx (474 lines).

Actions that differ:
- Guest: no add-to-basket, no favourites, no slot picker interaction, no AI assistant
- Buyer: AddToCartButton + qty stepper, FavouriteButton, interactive slot selector, AI assistant

Content sections are identical: image/illustration, name, price, unit, stock line, description, stall strip, reviews, related produce. Premise holds.

---

## 8. Extraction order (Stage 3, simplest first)

1. MarketsView - list of cards + map, zero guest actions
2. MarketView - market detail with stall list; clock present on public
3. StallsView - stall index card grid
4. StallView - stall detail; pickup slots read-only for guests
5. BrowseView - produce grid + category filters
6. ProduceView - produce detail; most action forks but well understood

---

## 9. Line-count targets

| Scope | Current | Target |
|---|---|---|
| Guest catalogue (6 pages jsx+css) | ~11,700 | ~900 (thin wrappers) |
| Buyer catalogue (6 pages jsx+css) | ~12,000 | ~900 (thin wrappers) |
| Shared view components (6 pairs) | 0 | ~2,400 |
| Net total | ~23,700 | ~4,200 |

Target: roughly a fifth of current size.
