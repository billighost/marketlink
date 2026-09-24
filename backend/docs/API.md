# MarketLink API Documentation (Stage 1)

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
