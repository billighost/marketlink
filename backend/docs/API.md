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
