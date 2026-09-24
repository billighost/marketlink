# MarketLink API Documentation (Stages 1 - 4)

> Base Path: `/api`  
> Protocol: HTTP/JSON  
> Success shape: `{ "data": ... }`  
> Error shape: `{ "error": { "code": "...", "message": "...", "details": [...] } }`

---

## 1. System & Health

### `GET /api/health`
Lightweight load-balancer probe without database overhead.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "data": {
    "status": "ok",
    "uptimeSec": 42,
    "time": "2026-09-24T08:12:00.000Z"
  }
}
```

### `GET /api/ready`
Database ping probe verifying active connection to MongoDB.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "data": {
    "status": "ready",
    "db": "connected"
  }
}
```
- **Error Response**: `503 Service Unavailable` if database ping fails.

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register/customer`
Registers a new Customer account, creates a session, sets an HTTP-only refresh cookie, and returns an access token.
- **Auth**: None (Rate Limit: 20/hr/IP)
- **Request Body**:
```json
{
  "name": "George Adams",
  "phone": "(555) 012-3456",
  "email": "george@example.com",
  "address": "14 Birch Lane, Maplewood, NJ",
  "password": "Password123"
}
```
- **Response**: `201 Created`
- **Set-Cookie**: `refreshToken=...; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=2592000`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d5912",
      "role": "customer",
      "name": "George Adams",
      "email": "george@example.com",
      "phone": "(555) 012-3456",
      "address": "14 Birch Lane, Maplewood, NJ",
      "status": "active",
      "homeMarketId": null,
      "savedMarketIds": [],
      "notificationPrefs": {
        "orderUpdates": true,
        "readyAlerts": true,
        "weeklyPicks": false,
        "restockAlerts": false
      },
      "createdAt": "2026-09-24T08:00:00.000Z",
      "updatedAt": "2026-09-24T08:00:00.000Z",
      "lastLoginAt": "2026-09-24T08:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Errors**:
  - `409 Conflict` (`EMAIL_TAKEN`): If an account with that email already exists.
  - `422 Unprocessable Content` (`VALIDATION_FAILED`): If inputs are invalid or unknown fields are present.

---

### `POST /api/auth/register/farmer`
Registers a new Farmer account with initial status `pending` and initializes the linked `farmers` profile document.
- **Auth**: None (Rate Limit: 20/hr/IP)
- **Request Body**:
```json
{
  "stallName": "Riverbend Farm",
  "contactPerson": "Anna Kowalski",
  "phone": "(555) 300-1001",
  "email": "anna@riverbend.farm",
  "address": "Route 4, Hunterdon County, NJ",
  "password": "FarmPassword1"
}
```
- **Response**: `201 Created`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d591a",
      "role": "farmer",
      "name": "Anna Kowalski",
      "email": "anna@riverbend.farm",
      "status": "pending",
      "createdAt": "2026-09-24T08:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /api/auth/login`
Signs in an existing Customer, Farmer, or Admin.
- **Auth**: None (Rate Limit: 10/15min/IP)
- **Request Body**:
```json
{
  "email": "george@example.com",
  "password": "market123"
}
```
- **Response**: `200 OK`
- **Set-Cookie**: `refreshToken=...; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=2592000`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d5912",
      "role": "customer",
      "name": "George Adams",
      "email": "george@example.com",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Account Status Enforcement**:
  - Customer status `inactive` → `403 Forbidden` (`ACCOUNT_INACTIVE`)
  - Farmer status `suspended` or `rejected` → `403 Forbidden` (`ACCOUNT_SUSPENDED`)
  - Farmer status `pending` → `200 OK` (user object carries `status: "pending"`)
  - Invalid email or wrong password → `401 Unauthorized` (`INVALID_CREDENTIALS` with identical timing and message)

---

### `POST /api/auth/refresh`
Rotates the refresh token, revokes the previous token, and issues a new access token and refresh cookie.
- **Auth**: Reads HTTP-only `refreshToken` cookie
- **Response**: `200 OK`
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6ab4d9e99d438e0bfa7d5912",
      "role": "customer",
      "name": "George Adams"
    }
  }
}
```
- **Reuse Detection**: If an already rotated or revoked token is presented, all active sessions for that user are immediately invalidated and `401 Unauthorized` is returned.

---

### `POST /api/auth/logout`
Revokes the current session and clears the refresh cookie.
- **Auth**: Optional / Reads `refreshToken` cookie
- **Response**: `204 No Content`

---

### `GET /api/auth/me`
Retrieves the authenticated user. For Farmers, includes stall information and approval status.
- **Auth**: Bearer access token
- **Response (Customer)**: `200 OK`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d5912",
      "role": "customer",
      "name": "George Adams",
      "email": "george@example.com",
      "phone": "(555) 012-3456",
      "address": "14 Birch Lane, Maplewood, NJ",
      "status": "active"
    }
  }
}
```
- **Response (Farmer)**: `200 OK`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d591a",
      "role": "farmer",
      "name": "Anna Kowalski",
      "email": "riverbend@example.com",
      "status": "active",
      "farmer": {
        "stallName": "Riverbend Farm",
        "approvalStatus": "active"
      }
    }
  }
}
```

---

### `POST /api/auth/forgot-password`
Initiates a password reset flow. Generates a secure reset token valid for 30 minutes. Always returns 200 to prevent email enumeration.
- **Auth**: None (Rate Limit: 5/hr/IP)
- **Request Body**:
```json
{
  "email": "george@example.com"
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "message": "If an account with that email exists, we've sent password reset instructions."
  }
}
```

---

### `POST /api/auth/reset-password`
Validates a password reset token, updates the password hash, marks the token as used, and invalidates all existing sessions.
- **Auth**: None
- **Request Body**:
```json
{
  "token": "48_character_or_32_byte_hex_token",
  "password": "NewSecretPassword123"
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "message": "Your password has been successfully reset. Please sign in with your new password."
  }
}
```

---

## 3. Users (`/api/users`)

### `GET /api/users/me`
Fetches the full authenticated profile.
- **Auth**: Bearer access token
- **Response**: `200 OK`
```json
{
  "data": {
    "user": {
      "id": "6ab4d9e99d438e0bfa7d5912",
      "role": "customer",
      "name": "George Adams",
      "email": "george@example.com",
      "phone": "(555) 012-3456",
      "address": "14 Birch Lane, Maplewood, NJ",
      "status": "active",
      "homeMarketId": "6ab4d9e99d438e0bfa7d590d",
      "savedMarketIds": ["6ab4d9e99d438e0bfa7d590d"],
      "notificationPrefs": {
        "orderUpdates": true,
        "readyAlerts": true,
        "weeklyPicks": true,
        "restockAlerts": false
      }
    }
  }
}
```

---

### `PATCH /api/users/me`
Updates permitted profile fields: `name, phone, address, homeMarketId, savedMarketIds, notificationPrefs`.
- **Auth**: Bearer access token
- **Request Body**:
```json
{
  "phone": "(555) 999-0000",
  "address": "25 Maplewood Ave",
  "notificationPrefs": {
    "orderUpdates": true,
    "readyAlerts": true,
    "weeklyPicks": true,
    "restockAlerts": true
  }
}
```
- **Response**: `200 OK` with updated user object.
- **Error**: `422 Unprocessable Content` if attempting to modify disallowed fields (e.g. `email` or `role`).

---

### `POST /api/users/me/password`
Updates the authenticated user's password after verifying their current password. Revokes other active sessions.
- **Auth**: Bearer access token
- **Request Body**:
```json
{
  "currentPassword": "market123",
  "newPassword": "NewPassword456"
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "message": "Password updated successfully."
  }
}
```

---

### `DELETE /api/users/me/sessions`
Signs out of all active devices by revoking all refresh sessions.
- **Auth**: Bearer access token
- **Response**: `200 OK`
```json
{
  "data": {
    "message": "Signed out of all devices successfully."
  }
}
```

---

## 4. Contact (`/api/contact`)

### `POST /api/contact`
Submits a guest or customer support inquiry into `contactMessages`.
- **Auth**: None (Rate Limit: 5/hr/IP)
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "topic": "order",
  "message": "Can I pick up my pre-order before 8:30 AM?"
}
```
- **Allowed Topics**: `'order' | 'farmer-help' | 'feedback' | 'other'`
- **Response**: `201 Created`
```json
{
  "data": {
    "message": "Thank you for reaching out! We've received your message and will respond shortly."
  }
}
```

---

## 5. Non-Production RBAC Guard Probes

Accessible only when `NODE_ENV !== 'production'`:
- `GET /api/auth/_ping/customer`: Requires role `customer`. Returns `200 OK { data: { ok: true, role: "customer" } }`.
- `GET /api/auth/_ping/farmer`: Requires role `farmer`. Returns `200 OK { data: { ok: true, role: "farmer" } }`.
- `GET /api/auth/_ping/admin`: Requires role `admin`. Returns `200 OK { data: { ok: true, role: "admin" } }`.

---

## 6. Categories & Announcements

### `GET /api/categories`
Returns active categories ordered by `sortOrder`, with aggregated in-stock product counts cached for 60 seconds.
- **Auth**: None (Public)
- **Headers**: `Cache-Control: public, max-age=60`
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "6ab4eaacb21cba5dcf2eb84f",
      "name": "Vegetables",
      "slug": "vegetables",
      "sortOrder": 1,
      "art": "carrot",
      "productCount": 11
    }
  ]
}
```

### `GET /api/announcements`
Active broadcast announcements filtered by the caller's role (or `all`).
- **Auth**: Optional
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "6ab4eaacb21cba5dcf2eb85c",
      "title": "Welcome to MarketLink!",
      "body": "Pre-order by Friday 6 PM for Saturday morning pickup.",
      "audience": "all",
      "publishedAt": "2026-09-24T08:00:00.000Z"
    }
  ]
}
```

---

## 7. Public Guest Landing (`/api/public`)

### `GET /api/public/home`
Single-roundtrip guest landing dashboard containing market board, featured farmers, and announcements.
- **Auth**: None (Public)
- **Headers**: `Cache-Control: public, max-age=60`
- **Response**: `200 OK`
```json
{
  "data": {
    "board": {
      "market": { "id": "...", "name": "Elm Street Market", "slug": "elm-street-market" },
      "day": "sat",
      "items": [
        {
          "id": "...",
          "name": "Heirloom tomatoes",
          "farmerName": "Riverbend Farm",
          "stallNumber": "Stall 4",
          "priceCents": 450,
          "unit": "lb",
          "availability": "in"
        }
      ]
    },
    "farmers": [
      {
        "id": "...",
        "stallName": "Riverbend Farm",
        "stallNumber": "Stall 4",
        "specialty": "Vegetables and herbs",
        "art": "crate-carrots",
        "imageUrl": null,
        "ratingAvg": 4.9,
        "ratingCount": 28,
        "operatingDays": ["sat", "sun"],
        "markets": [{ "id": "...", "name": "Elm Street Market" }],
        "isTopSeller": true,
        "isNew": false
      }
    ],
    "announcements": [...]
  }
}
```

---

## 8. Markets (`/api/markets`)

### `GET /api/markets`
Discovers markets with optional geolocation distance sorting, day filtering, and keyset pagination.
- **Auth**: Bearer access token
- **Query Parameters**:
  - `lat`, `lng`: WGS84 coordinates (triggers `$geoNear` distance calculation)
  - `radiusKm`: Max distance in kilometers (default: 25)
  - `day`: Operating day filter (`'mon'..'sun'`)
  - `q`: Name prefix search
  - `cursor`, `limit`: Keyset pagination parameters
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "6ab4eaacb21cba5dcf2eb853",
      "name": "Elm Street Market",
      "slug": "elm-street-market",
      "address": "Elm Street, Springfield",
      "location": { "lat": 40.7128, "lng": -74.006 },
      "schedule": [{ "day": "sat", "openMin": 480, "closeMin": 780 }],
      "farmerCount": 6,
      "distanceMeters": 1240,
      "nextOpening": { "start": "...", "end": "..." },
      "directionsUrls": {
        "google": "https://www.google.com/maps/dir/?api=1&destination=40.7128,-74.006",
        "osm": "https://www.openstreetmap.org/directions?to=40.7128%2C-74.006"
      }
    }
  ],
  "meta": { "nextCursor": null, "limit": 20 }
}
```

### `GET /api/markets/:id`
Retrieves `marketDetail` including facilities, note, and timezone.
- **Auth**: Bearer access token
- **Response**: `200 OK`

### `GET /api/markets/:id/farmers`
Attending farmers directory at specified market, sorted by `rating | top | new`.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [farmerCard...], meta: { nextCursor, limit } }`

### `GET /api/markets/:id/products`
Fresh catalog items available from farmers attending this market.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [productCard...], meta: { nextCursor, limit } }`

---

## 9. Farmers (`/api/farmers`)

### `GET /api/farmers`
Browse directory of listed approved farmers with filters and keyset pagination.
- **Auth**: Bearer access token
- **Query Parameters**:
  - `q`: Text search on stall name or specialty
  - `category`: Category slug filter (denormalized `categorySlugs`)
  - `market`: Market ObjectId
  - `day`: Operating day (`'mon'..'sun'`)
  - `sort`: `'rating'` (default) | `'top'` | `'new'` | `'name'`
  - `cursor`, `limit`: Keyset pagination parameters
- **Response**: `200 OK { data: [farmerCard...], meta: { nextCursor, limit } }`

### `GET /api/farmers/:id`
Returns `farmerDetail` with story, since, pickup windows, and rating breakdown (no private phone or email).
- **Auth**: Bearer access token
- **Response**: `200 OK`

### `GET /api/farmers/:id/products`
Farmer's product catalog filtered by availability and category.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [productCard...], meta: { nextCursor, limit } }`

### `GET /api/farmers/:id/reviews`
Visible reviews for farmer with redacted customer names (e.g. "George A.").
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [reviewItem...], meta: { nextCursor, limit } }`

### `GET /api/farmers/:id/pickup-slots`
Upcoming market pickup slots computed in market timezone across operating days.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [ { start, end, marketId, marketName, stallNumber, cutoffAt, isOpen, label } ] }`

---

## 10. Products (`/api/products`)

### `GET /api/products`
The core catalog browse endpoint with multi-attribute filtering, keyset pagination, and text search.
- **Auth**: Bearer access token
- **Query Parameters**:
  - `q`: Search query (full-text search for >= 3 chars, anchored prefix for 2 chars)
  - `category`: Comma-separated category slugs (max 5)
  - `minPrice`, `maxPrice`: Price range in integer cents
  - `market`: Filter by market ObjectId
  - `day`: Filter by operating day (`'mon'..'sun'`)
  - `availability`: `'in' | 'low' | 'out'` (excludes `out` by default unless `includeSoldOut=true`)
  - `tags`: CSV tags (`seasonal, organic, new, bestseller`)
  - `farmer`: Filter by farmer ObjectId
  - `sort`: `'featured'` (default) | `'price_asc'` | `'price_desc'` | `'newest'` | `'popular'`
  - `cursor`, `limit`: Keyset pagination parameters
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "6ab4eaacb21cba5dcf2eb869",
      "name": "Heirloom tomatoes",
      "priceCents": 450,
      "unit": "lb",
      "availability": "in",
      "art": "tomato",
      "imageUrl": null,
      "tags": ["seasonal", "bestseller"],
      "ratingAvg": 4.9,
      "ratingCount": 28,
      "category": { "slug": "vegetables", "name": "Vegetables" },
      "farmer": {
        "id": "6ab4eaacb21cba5dcf2eb862",
        "stallName": "Riverbend Farm",
        "stallNumber": "Stall 4",
        "art": "crate-carrots"
      },
      "cutoffAt": "2026-09-25T20:00:00.000Z",
      "createdAt": "2026-09-24T08:00:00.000Z"
    }
  ],
  "meta": { "nextCursor": "...", "limit": 20, "total": 46 }
}
```

### `GET /api/products/:id`
Full product detail with description, inventory remaining, cutoff countdown, and up to 3 upcoming pickup slots.
- **Auth**: Bearer access token
- **Response**: `200 OK`

### `GET /api/products/:id/reviews`
Product customer reviews list.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [reviewItem...], meta: { nextCursor, limit } }`

### `GET /api/products/:id/related`
Related items recommendations: `{ moreFromFarmer: productCard[8], youMightLike: productCard[8] }`.
- **Auth**: Bearer access token
- **Response**: `200 OK`

---

## 11. Search (`/api/search`)

### `GET /api/search/suggestions?q=`
Sub-30ms instant auto-suggestions matching prefixes across products, farmers, and categories.
- **Auth**: Bearer access token
- **Query Parameters**: `q` (minimum 2 characters, 422 if shorter)
- **Response**: `200 OK`
```json
{
  "data": {
    "products": [
      { "id": "...", "name": "Heirloom tomatoes", "art": "tomato", "priceCents": 450, "unit": "lb" }
    ],
    "farmers": [
      { "id": "...", "stallName": "Riverbend Farm", "specialty": "Vegetables and herbs", "art": "crate-carrots" }
    ],
    "categories": [
      { "slug": "vegetables", "name": "Vegetables", "art": "carrot" }
    ]
  }
}
```

### `GET /api/search/history`
Returns the caller's latest 10 distinct search terms.
- **Auth**: Bearer access token
- **Response**: `200 OK { data: [ { id, term, at } ] }`

### `POST /api/search/history`
Records or updates a search term, deduplicating and trimming history to max 10 entries.
- **Auth**: Bearer access token
- **Request Body**: `{ "term": "tomatoes" }`
- **Response**: `201 Created`

### `DELETE /api/search/history/:id`
Deletes a single search history entry owned by the user.
- **Auth**: Bearer access token
- **Response**: `200 OK`

### `DELETE /api/search/history`
Clears all search history entries for the user.
- **Auth**: Bearer access token
- **Response**: `200 OK`

---

## 12. Feed Engine (`/api/feed`)

### `GET /api/feed`
The curated, infinite Home feed. Delivers Batch 0 (curated fixed sections) and endless batches 1..n with deterministic 6-batch deduplication.
- **Auth**: Bearer access token
- **Query Parameters**: `cursor` (signed HMAC-SHA256 opaque string)
- **Response**: `200 OK`
```json
{
  "data": {
    "sections": [
      {
        "id": "featured-today",
        "type": "featureRow",
        "title": "Featured today",
        "subtitle": "Three things worth walking over for.",
        "seeAll": { "path": "/products", "query": { "sort": "featured" } },
        "items": [ /* 3 productCards from different farmers */ ]
      },
      {
        "id": "recently-bought",
        "type": "productRow",
        "title": "Recently bought",
        "seeAll": { "path": "/orders", "query": { "tab": "past" } },
        "items": [ /* productCards with lastBoughtAt */ ]
      },
      {
        "id": "top-farmers",
        "type": "farmerRow",
        "title": "Top-selling Farmers",
        "items": [ /* farmerCards */ ]
      }
    ]
  },
  "meta": {
    "nextCursor": "eyJ2IjoxLCJzIjoiZmVlZCIsImsiOlsxXSwic2VlZCI6Mzg4NTkxNDY5NX0.WirOE6HS7wqgmWa40ppC8A",
    "batch": 0,
    "hasMore": true
  }
}
```

### `GET /api/feed/meta`
Header status sub-line computed in market timezone.
- **Auth**: Bearer access token
- **Response**: `200 OK`
```json
{
  "data": {
    "greetingName": "George",
    "homeMarket": { "id": "...", "name": "Elm Street Market", "slug": "elm-street-market" },
    "nextOpening": { "start": "2026-09-26T12:00:00.000Z", "end": "2026-09-26T17:00:00.000Z" },
    "nextCutoffAt": "2026-09-25T22:00:00.000Z",
    "line": "Elm Street Market opens Saturday at 8am. Order by Friday, 6pm."
  }
}
```

---

## 8. Cart Quoting (`/api/cart`)

### `POST /api/cart/quote`
Recalculates cart truth with live stock, prices, issues, and upcoming slots within strict 3-query database budget.
- **Auth**: Customer (`requireRole('customer')`)
- **Request Body**:
```json
{
  "groups": [
    {
      "farmerId": "6ab4eb7801b3e33e11bff15d",
      "items": [
        { "productId": "6ab4eb7801b3e33e11bff178", "quantity": 2, "expectedPriceCents": 450 }
      ],
      "slotStart": "2026-10-01T12:00:00.000Z"
    }
  ]
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "groups": [
      {
        "farmer": { "id": "...", "stallName": "Riverbend Farm", "stallNumber": "Stall 4", "art": "crate-carrots" },
        "market": { "id": "...", "name": "Elm Street Market" },
        "slots": [ { "start": "2026-10-01T12:00:00.000Z", "end": "2026-10-01T14:00:00.000Z", "label": "Thursday 8:00 AM - 10:00 AM" } ],
        "cutoffAt": "2026-10-01T00:00:00.000Z",
        "selectedSlot": { "start": "2026-10-01T12:00:00.000Z", "end": "2026-10-01T14:00:00.000Z", "label": "Thursday 8:00 AM - 10:00 AM" },
        "items": [
          {
            "productId": "6ab4eb7801b3e33e11bff178",
            "name": "Heirloom tomatoes",
            "quantity": 2,
            "unitPriceCents": 450,
            "lineTotalCents": 900,
            "unit": "lb",
            "availability": "in",
            "quantityAvailable": 24,
            "issues": []
          }
        ],
        "groupSubtotalCents": 900,
        "issues": []
      }
    ],
    "subtotalCents": 900,
    "totalCents": 900,
    "canCheckout": true,
    "blockingIssueCount": 0
  }
}
```

---

## 9. Checkout & Pre-Orders (`/api/orders`)

### `POST /api/orders/checkout`
Atomically reserves stock, creates one order per farmer with contiguous order numbers, and enforces strict idempotency.
- **Auth**: Customer (`requireRole('customer')`)
- **Headers**: `Idempotency-Key: <unique-uuid-or-string>` (Required)
- **Request Body**:
```json
{
  "groups": [
    {
      "farmerId": "6ab4eb7801b3e33e11bff15d",
      "slotStart": "2026-10-01T12:00:00.000Z",
      "note": "Please pack firm tomatoes",
      "items": [
        { "productId": "6ab4eb7801b3e33e11bff178", "quantity": 2 }
      ]
    }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "data": {
    "checkoutId": "6ab4fc7a01b3e33e11bff999",
    "orders": [
      {
        "id": "6ab4fc7a01b3e33e11bff888",
        "orderNumber": "ML-1089",
        "status": "placed",
        "farmer": { "id": "...", "stallName": "Riverbend Farm", "stallNumber": "Stall 4", "art": "crate-carrots" },
        "pickup": { "start": "2026-10-01T12:00:00.000Z", "end": "2026-10-01T14:00:00.000Z", "label": "Thursday 8:00 AM - 10:00 AM" },
        "cutoffAt": "2026-10-01T00:00:00.000Z",
        "itemCount": 2,
        "totalCents": 900,
        "itemsPreview": [ { "name": "Heirloom tomatoes", "art": "tomato" } ],
        "canModify": true,
        "reviewed": false
      }
    ]
  }
}
```

### `GET /api/orders`
Lists customer orders with active/past tab filtering and cursor keyset pagination.
- **Auth**: Customer
- **Query Params**: `tab=active|past`, `cursor=...`, `limit=10`
- **Response**: `200 OK`

### `GET /api/orders/:id`
Retrieves complete order detail with timeline, pickup directions, and action flags. Strict owner isolation (404 on IDOR).
- **Auth**: Customer (Owner only)
- **Response**: `200 OK`

### `PATCH /api/orders/:id`
Modifies placed pre-order quantities, pickup slot, or note before cut-off with atomic stock delta adjustments.
- **Auth**: Customer (Owner only)
- **Request Body**:
```json
{
  "items": [{ "productId": "6ab4eb7801b3e33e11bff178", "quantity": 3 }],
  "note": "Updated note"
}
```
- **Response**: `200 OK`

### `POST /api/orders/:id/cancel`
Cancels placed or accepted pre-order before cut-off and restores reserved stock.
- **Auth**: Customer (Owner only)
- **Request Body**: `{ "reason": "Cannot attend market this Saturday" }`
- **Response**: `200 OK`

### `GET /api/orders/:id/reorder-preview`
Fetches past order line items with current live stock, prices, and availability flags for quick re-order.
- **Auth**: Customer (Owner only)
- **Response**: `200 OK`

---

## 10. Reviews (`/api/orders/:id/reviews` & `/api/reviews`)

### `POST /api/orders/:id/reviews`
Submits verified-purchase reviews for completed orders (one review per target per order). Updates farmer and product rating aggregates atomically.
- **Auth**: Customer (Owner only)
- **Request Body**:
```json
{
  "farmer": { "rating": 5, "comment": "Outstanding stall!" },
  "products": [
    { "productId": "6ab4eb7801b3e33e11bff178", "rating": 5, "comment": "Super sweet!" }
  ]
}
```
- **Response**: `201 Created`

### `PATCH /api/reviews/:id`
Author edits review rating or comment within 14-day window. Recalculates rating aggregates by the delta.
- **Auth**: Customer (Author only)
- **Request Body**: `{ "rating": 4, "comment": "Updated comment" }`
- **Response**: `200 OK`

### `DELETE /api/reviews/:id`
Author deletes review within 14-day window. Atomically decrements target rating aggregates.
- **Auth**: Customer (Author only)
- **Response**: `200 OK`

### `POST /api/reviews/:id/flag`
Flags a review for moderation review.
- **Auth**: Any authenticated user
- **Request Body**: `{ "reason": "Contains promotional spam or abusive language." }`
- **Response**: `200 OK`

---

## 11. Favorites & Restock Alerts (`/api/favorites`)

### `GET /api/favorites/ids`
Lightweight ID arrays for UI heart toggles (capped at 500 each).
- **Auth**: Customer
- **Response**: `200 OK`
```json
{
  "data": {
    "productIds": ["6ab4eb7801b3e33e11bff178"],
    "farmerIds": ["6ab4eb7801b3e33e11bff15d"]
  }
}
```

### `GET /api/favorites`
Cursor-paginated productCard or farmerCard list, most recent first.
- **Auth**: Customer
- **Query Params**: `type=product|farmer`, `cursor=...`, `limit=20`
- **Response**: `200 OK`

### `PUT /api/favorites/:type/:id`
Idempotent add to favorites.
- **Auth**: Customer
- **Response**: `200 OK`

### `DELETE /api/favorites/:type/:id`
Idempotent remove from favorites.
- **Auth**: Customer
- **Response**: `200 OK`

---

## 12. Notifications (`/api/notifications`)

### `GET /api/notifications`
Lists customer notifications with indexed unread count and optional unread filter.
- **Auth**: Any authenticated user
- **Query Params**: `unread=true`, `cursor=...`, `limit=20`
- **Response**: `200 OK`

### `POST /api/notifications/:id/read`
Marks single notification as read (owner isolated, 404 on IDOR).
- **Auth**: Any authenticated user
- **Response**: `200 OK`

### `POST /api/notifications/read-all`
Marks all user notifications as read.
- **Auth**: Any authenticated user
- **Response**: `200 OK`

---

## 13. Saved Markets & Home Market (`/api/users/me`)

### `GET /api/users/me/saved-markets`
Returns marketCards for customer's saved markets with directions and next opening.
- **Auth**: Any authenticated user
- **Response**: `200 OK`

### `PUT /api/users/me/saved-markets/:marketId`
Adds market to saved markets (max 10, idempotent).
- **Auth**: Any authenticated user
- **Response**: `200 OK`

### `DELETE /api/users/me/saved-markets/:marketId`
Removes market from saved markets (idempotent).
- **Auth**: Any authenticated user
- **Response**: `200 OK`

### `PUT /api/users/me/home-market/:marketId`
Updates customer's home market.
- **Auth**: Any authenticated user
- **Response**: `200 OK`

---

## 14. Home Summary (`/api/home`)

### `GET /api/home/summary`
Single-round-trip summary with ready for pickup order, next pickup order, and unread notification count.
- **Auth**: Customer
- **Response**: `200 OK`
```json
{
  "data": {
    "readyForPickup": null,
    "nextPickup": {
      "id": "...",
      "orderNumber": "ML-1043",
      "status": "placed",
      "farmer": { "id": "...", "stallName": "Riverbend Farm" },
      "pickup": { "start": "...", "end": "...", "label": "Saturday 8:00 AM - 10:00 AM" }
    },
    "unreadNotifications": 2,
    "cartHint": null
  }
}
```

---

## 15. Rule-Based Assistant (`/api/assistant`)

### `POST /api/assistant/message`
Answers queries about market schedules, farmer stall locations, produce availability, item prices, and order tracking in under 60ms.
- **Auth**: Customer (`assistantRateLimiter`: 30/min/user)
- **Request Body**:
```json
{
  "text": "When does Elm Street Market open?",
  "history": []
}
```
- **Response**: `200 OK`
```json
{
  "data": {
    "reply": "Elm Street Market is open Saturdays from 8:00 AM to 1:00 PM at 200 Elm Street, Maplewood, NJ.",
    "cards": [ { "type": "market", "id": "6ab4eb7801b3e33e11bff159" } ],
    "suggestions": [
      "Who sells at Elm Street Market?",
      "What's fresh on Saturday?",
      "Market directions"
    ]
  }
}
```

---

## 16. Farmer Profile & Slots (`/api/farmer`)

### `GET /api/farmer/profile`
Retrieves the authenticated farmer's profile, including stall details, attending markets, pickup windows, closures, and approval status.
- **Auth**: Farmer (`farmer` role)
- **Response**: `200 OK`
```json
{
  "data": {
    "id": "6ab4d9e99d438e0bfa7d5910",
    "stallName": "Riverbend Farm",
    "contactPerson": "Anna Kowalski",
    "phone": "(555) 300-1001",
    "bio": "Family-run organic vegetable farm...",
    "art": "farm",
    "status": "active",
    "listingEnabled": true,
    "markets": [
      { "id": "6ab4eb7801b3e33e11bff159", "name": "Elm Street Market" }
    ],
    "pickupWindows": [
      { "dayOfWeek": 6, "startTime": "08:00", "endTime": "13:00", "marketId": "6ab4eb7801b3e33e11bff159" }
    ],
    "closures": []
  }
}
```

### `PATCH /api/farmer/profile`
Updates farmer profile fields (bio, art, stallNumber, pickup windows, etc.).
- **Auth**: Approved Farmer (`farmer` role)
- **Response**: `200 OK`

### `POST /api/farmer/profile/markets/:marketId`
Adds attendance at an existing market.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `DELETE /api/farmer/profile/markets/:marketId`
Removes attendance at a market (prevented with 409 if pending or active orders exist).
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/profile/closures`
Schedules a temporary stall closure.
- **Auth**: Approved Farmer
- **Response**: `201 Created`

### `DELETE /api/farmer/profile/closures/:closureId`
Removes a scheduled closure.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `GET /api/farmer/slots`
Calculates and returns upcoming pickup slots for the next 14 days based on attending markets and pickup windows.
- **Auth**: Farmer
- **Response**: `200 OK`

---

## 17. Farmer Products & Templates (`/api/farmer/products`)

### `GET /api/farmer/products`
Lists the authenticated farmer's products with category, availability, and search filters, plus stock breakdown counts.
- **Auth**: Farmer
- **Query Params**: `categoryId`, `availability` (`in|low|out|hidden`), `search`, `sort`, `limit`, `cursor`
- **Response**: `200 OK`
```json
{
  "data": [...],
  "meta": { "counts": { "all": 8, "in": 5, "low": 2, "out": 1, "hidden": 0 } }
}
```

### `POST /api/farmer/products`
Creates a new product for the farmer stall. Automatically computes `nameLower`, `rnd`, and initial availability.
- **Auth**: Approved Farmer
- **Response**: `201 Created`

### `POST /api/farmer/products/bulk`
Executes bulk stock actions (`mark_sold_out`, `mark_available`, `hide`, `unhide`) on owned product IDs.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `GET /api/farmer/products/:id`
Gets full product details for an owned product.
- **Auth**: Farmer (Enforces tenant isolation: 404 for non-owned)
- **Response**: `200 OK`

### `PATCH /api/farmer/products/:id`
Updates product pricing, descriptions, tags, stock thresholds, or quantity.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `DELETE /api/farmer/products/:id`
Hard-deletes product if no historical orders reference it; soft-deletes (`archived: true`, `listed: false`) otherwise.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/products/:id/sold-out`
Quick-toggles a product to sold-out (`quantityAvailable: 0`, `availability: "out"`).
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/products/:id/available`
Restores a product to available with specified quantity or default weekly quantity.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/products/:id/hide` / `POST /api/farmer/products/:id/unhide`
Toggles product catalog visibility.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `GET /api/farmer/weekly-template`
Retrieves weekly restock template configuration for farmer products.
- **Auth**: Farmer
- **Response**: `200 OK`

### `PUT /api/farmer/weekly-template`
Updates weekly quantities and enabled status for farmer products.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/weekly-template/apply`
Applies the weekly restock template: resets quantities to defaults and triggers customer restock alerts.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

---

## 18. Farmer Orders & Pick List (`/api/farmer/orders`)

### `GET /api/farmer/orders`
Lists farmer orders filtered by tab (`active`, `today`, `all`), market, target date, or search query.
- **Auth**: Farmer
- **Response**: `200 OK`

### `GET /api/farmer/orders/:id`
Fetches full order details for an owned order.
- **Auth**: Farmer (Enforces tenant isolation: 404 for non-owned)
- **Response**: `200 OK`

### `POST /api/farmer/orders/:id/accept`
Transitions order from `placed` to `accepted`.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/orders/:id/ready`
Transitions order from `accepted` to `ready`. Triggers customer notification and email stub.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/orders/:id/complete`
Transitions order from `ready` to `completed`. Increments product sales counts.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `POST /api/farmer/orders/:id/decline`
Declines an incoming order and automatically restores reserved stock.
- **Auth**: Approved Farmer
- **Request Body**: `{ "reason": "Out of stock on harvest day" }`
- **Response**: `200 OK`

### `POST /api/farmer/orders/:id/cancel`
Farmer cancels an active order before pickup. Requires a valid reason.
- **Auth**: Approved Farmer
- **Response**: `200 OK`

### `GET /api/farmer/orders/pick-list`
Generates aggregated pick-list by produce item and by order for a target market date.
- **Auth**: Farmer
- **Query Params**: `targetDate` (YYYY-MM-DD), `marketId`
- **Response**: `200 OK`

---

## 19. Farmer Reviews & Replies (`/api/farmer/reviews`)

### `GET /api/farmer/reviews`
Lists all reviews left for the farmer stall or their products, with reply status and rating filters.
- **Auth**: Farmer
- **Response**: `200 OK`

### `POST /api/farmer/reviews/:id/reply`
Adds or updates a farmer's public reply to a customer review.
- **Auth**: Approved Farmer
- **Request Body**: `{ "reply": "Thank you for the kind feedback!" }`
- **Response**: `200 OK`

---

## 20. Farmer Insights & Analytics (`/api/farmer/insights`)

### `GET /api/farmer/insights/overview`
Returns high-level business intelligence KPIs (total revenue, completed orders, average order value, return customer rate) and weekly trend charts.
- **Auth**: Farmer
- **Response**: `200 OK`

### `GET /api/farmer/insights/products`
Returns product-level performance rankings (top sellers by revenue and volume, repeat purchase items).
- **Auth**: Farmer
- **Response**: `200 OK`

---

## 21. Uploads (`/api/farmer/uploads` & `/uploads`)

### `POST /api/farmer/uploads/image`
Uploads a product or stall image. Validates magic bytes (JPEG, PNG, WebP only) and limits size to 1MB.
- **Auth**: Approved Farmer
- **Response**: `201 Created`
```json
{
  "data": {
    "url": "/uploads/a1b2c3d4e5f6...jpg"
  }
}
```

### `GET /uploads/:filename`
Serves stored media files with `X-Content-Type-Options: nosniff` and caching headers.
- **Auth**: Public

---

## 22. Admin Overview & People Management (`/api/admin`)

### `GET /api/admin/overview`
Platform-wide operational dashboard metrics: user counts, active farmers, total orders, GMV, open moderation flags, and recent audit logs.
- **Auth**: Admin (`admin` role)
- **Response**: `200 OK`

### `GET /api/admin/people`
Lists platform users and farmers with filtering by role (`customer|farmer|admin`), status (`active|pending|suspended`), and text search.
- **Auth**: Admin
- **Response**: `200 OK`

### `PATCH /api/admin/people/farmers/:id/status`
Updates farmer account status (`active|pending|suspended`). Automatically manages `listingEnabled` and syncs market farmer counts.
- **Auth**: Admin
- **Request Body**: `{ "status": "active" }`
- **Response**: `200 OK`

### `PATCH /api/admin/people/customers/:id/status`
Updates customer account status (`active|suspended`).
- **Auth**: Admin
- **Response**: `200 OK`

### `GET /api/admin/people/users/:id`
Retrieves full user detail, linked farmer profile, and order history.
- **Auth**: Admin
- **Response**: `200 OK`

---

## 23. Admin Markets & Moderation (`/api/admin`)

### `GET /api/admin/markets`
Admin market directory with operational details and attending farmer rosters.
- **Auth**: Admin
- **Response**: `200 OK`

### `POST /api/admin/markets`
Creates a new market venue.
- **Auth**: Admin
- **Response**: `201 Created`

### `PATCH /api/admin/markets/:id`
Updates market details, schedules, or active status.
- **Auth**: Admin
- **Response**: `200 OK`

### `DELETE /api/admin/markets/:id`
Removes market venue (prevented with 409 if active farmers are attending, unless `force=true`).
- **Auth**: Admin
- **Response**: `200 OK`

### `GET /api/admin/moderation`
Lists flagged content (listings, reviews) awaiting administrative moderation.
- **Auth**: Admin
- **Response**: `200 OK`

### `POST /api/admin/moderation/:id/resolve`
Takes moderation action on a flag (e.g. delist product, hide review) and logs to audit trail.
- **Auth**: Admin
- **Response**: `200 OK`

### `POST /api/admin/moderation/:id/dismiss`
Dismisses an open moderation flag without taking destructive action.
- **Auth**: Admin
- **Response**: `200 OK`

---

## 24. Admin Reports & System Settings (`/api/admin`)

### `GET /api/admin/reports/:reportType.csv`
Generates downloadable, compliant CSV reports for administrative export.
- **Auth**: Admin
- **Supported Reports**: `sales.csv`, `orders.csv`, `inventory.csv`, `farmers.csv`, `customers.csv`
- **Response**: `200 OK` (`Content-Type: text/csv; charset=utf-8`)

### `GET /api/admin/settings`
Retrieves system configuration, feature flags, announcements, categories, and contact messages.
- **Auth**: Admin
- **Response**: `200 OK`

### `PATCH /api/admin/settings`
Updates global settings and feature flags (e.g. toggle P2P messaging, maintenance mode).
- **Auth**: Admin
- **Response**: `200 OK`

### `POST /api/admin/settings/announcements`
Publishes platform-wide or targeted banner announcements.
- **Auth**: Admin
- **Response**: `201 Created`

### `POST /api/admin/settings/categories`
Creates or manages product taxonomy categories.
- **Auth**: Admin
- **Response**: `201 Created`

### `PATCH /api/admin/settings/messages/:id`
Marks contact inquiries as read or archived.
- **Auth**: Admin
- **Response**: `200 OK`

