<<<<<<< HEAD
# MarketLink API Specification (Stage 5 Contract Freeze)> **Base URL**: `/api`  > **Protocol**: HTTP 1.1 / JSON (RESTful)  > **Success Payload**: `{ "data": <payload>, "meta": { ... } }`  > **Error Payload**: `{ "error": { "code": "<CODE>", "message": "<MSG>", "details": [ { "field": "<f>", "message": "<m>" } ] } }`  > **Total Registered Endpoints**: 134---## Architecture Conventions & Data Types1. **Identifiers**: Internal MongoDB `_id` is always projected out and exposed as string `id` (24-hex string). Never expose `_id`.2. **Monetary Values**: All prices, fees, totals, and line totals are represented strictly as **positive integer cents** (e.g. `$4.50` is `450`). Never use floating-point numbers for currency.3. **Dates & Timestamps**: Stored as BSON Dates and serialized to ISO 8601 UTC strings (e.g. `2026-09-24T08:00:00.000Z`).4. **Tenant Isolation & IDOR Protection**: A Customer can never inspect another Customer's orders or favorites. A Farmer can never view or modify another Farmer's inventory, orders, or reviews. Accessing another user's private resource ID returns `404 NOT_FOUND` to prevent resource enumeration.5. **Strict Input Validation**: All write endpoints strictly reject unknown/unregistered fields with `422 VALIDATION_FAILED`. Operators prefixed with `$` are neutralized by injection sanitization middleware.---## Global Pagination SpecificationAll collection endpoints support keyset (cursor-based) pagination to guarantee stable ordering, prevent duplicate records across page boundaries, and eliminate unbounded offsets.- **Parameters**:  - `limit` (optional integer): Number of records per page. Default is `20`, maximum allowed is `50`.  - `cursor` (optional string): An opaque, tamper-proof base64url token encoding `{ v: 1, s: sortKey, k: [sortValues...], id: docId }` signed with HMAC-SHA256.- **Response Metadata**:  ```json  {    "meta": {      "limit": 20,      "hasMore": true,      "nextCursor": "eyJ2IjoxLCJzIjoicmVjZW50IiwiayI6WyIyMDI2LTA5LTI0Il0sImlkIjoiNmFiNGQ...""    }  }  ```- **Boundary Conditions**:  - When `hasMore` is `false`, `nextCursor` is `null`.  - Passing an invalid, malformed, or tampered cursor yields `400 INVALID_CURSOR`.---## Global Error Codes ReferenceThe following table documents all machine-readable error codes emitted by MarketLink:| HTTP Status | Error Code | Trigger Condition / Description ||:---|:---|:---|| **400** | `BAD_JSON` | Malformed JSON in request body or invalid syntax. || **400** | `INVALID_CURSOR` | Cursor payload tampered, expired, or HMAC signature mismatch. || **401** | `UNAUTHENTICATED` | Missing, invalid, or malformed Authorization Bearer header. || **401** | `TOKEN_EXPIRED` | Access JWT has expired (15-minute validity window). || **401** | `INVALID_CREDENTIALS` | Email not found or password incorrect (constant-time response). || **401** | `REFRESH_REUSE_DETECTED` | Revoked refresh token presented; causes immediate eviction of all sessions. || **403** | `FORBIDDEN` | Authenticated user lacks required role (e.g. Customer accessing Farmer API). || **403** | `ACCOUNT_INACTIVE` | Customer account status is deactivated or inactive. || **403** | `ACCOUNT_SUSPENDED` | Farmer stall is suspended or rejected by an administrator. || **403** | `FARMER_NOT_APPROVED` | Farmer account is in pending state and cannot publish catalog items. || **403** | `CANNOT_MODERATE_ADMIN` | Administrator attempted to suspend or deactivate another Admin. || **404** | `NOT_FOUND` | Resource does not exist, or tenant isolation (IDOR) masked as 404. || **409** | `EMAIL_TAKEN` | User registration attempted with an already registered email. || **409** | `CONFLICT` | General state conflict or duplicate unique field. || **409** | `CATEGORY_EXISTS` | Category with the same name or slug already exists. || **409** | `CATEGORY_IN_USE` | Attempted to delete a category that still contains products. || **409** | `ALREADY_REVIEWED` | Customer already submitted a review for this order/target. || **409** | `ALREADY_FLAGGED` | User already reported this review for moderation. || **409** | `ORDER_NOT_COMPLETED` | Attempted to review an order that has not been marked completed. || **409** | `EDIT_WINDOW_EXPIRED` | Review update attempted after the 14-day edit window elapsed. || **409** | `CANNOT_CANCEL` | Order cannot be cancelled once in `ready` or `completed` status. || **409** | `SLOT_FULL` | Pickup window capacity has been filled by competing checkout. || **409** | `STOCK_DEPLETED` | Product inventory is insufficient to satisfy requested quantity. || **409** | `PRICE_CHANGED` | Catalog price changed between cart quote creation and checkout. || **409** | `UPLOAD_LIMIT` | Farmer reached the maximum quota of 200 stored images. || **409** | `INVALID_STATE` | State machine transition is disallowed for the current status. || **413** | `PAYLOAD_TOO_LARGE` | Request body exceeds limit (100KB for JSON, 1MB for media uploads). || **422** | `VALIDATION_FAILED` | Schema constraint violated, missing required fields, or unknown fields present. || **422** | `INVALID_IMAGE` | Uploaded file failed magic-byte verification (only JPEG, PNG, WebP supported). || **422** | `INVALID_RESET_TOKEN` | Password reset token is invalid, expired, or already used. || **422** | `RANGE_TOO_LARGE` | Date range parameter exceeds the 366-day administrative threshold. || **429** | `RATE_LIMITED` | Request threshold exceeded for route class (standard rate limiter). || **429** | `TOO_MANY_ATTEMPTS` | Account lockout: 5 failed login attempts for this email within 15 minutes. || **500** | `INTERNAL` | Internal server error. Details suppressed in production environments. || **503** | `SERVICE_UNAVAILABLE` | MongoDB connection is offline or unavailable during operational ping. |---## 1. System & Health Probes### GET /api/healthLightweight load-balancer probe without database overhead.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/readyDatabase readiness probe verifying active MongoDB connection.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/versionBackend service name, version, and build info.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 2. Authentication & Session Management### POST /api/auth/register/customerRegisters a new Customer account.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `register`- **Request Schema**: `registerCustomer` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/auth/register/farmerRegisters a new Farmer account with initial pending status.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `register`- **Request Schema**: `registerFarmer` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/auth/loginSigns in an existing user with credential verification and account lockout.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `login`- **Request Schema**: `login` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/auth/refreshRotates refresh token and issues a new access token.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/auth/logoutTerminates the current refresh session and clears cookie.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/auth/meReturns profile data for the currently authenticated session.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/auth/forgot-passwordGenerates password reset token and sends email instructions.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `forgot`- **Request Schema**: `forgotPassword` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/auth/reset-passwordResets user password with valid single-use token.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Request Schema**: `resetPassword` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/auth/_ping/customerRBAC verification ping for customer role.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/auth/_ping/farmerRBAC verification ping for farmer role.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/auth/_ping/adminRBAC verification ping for admin role.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 3. Customer Profile & Account Settings### GET /api/users/meGet full profile of authenticated user.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PATCH /api/users/meUpdate permitted profile fields.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Request Schema**: `updateUserProfile` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/users/me/passwordChange account password.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Request Schema**: `changePassword` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/users/me/sessionsSign out of all devices and revoke all refresh sessions.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/users/me/saved-marketsList saved markets for authenticated user.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PUT /api/users/me/saved-markets/:marketIdSave a market to bookmarks (max 10).- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/users/me/saved-markets/:marketIdRemove market from saved bookmarks.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### PUT /api/users/me/home-market/:marketIdSet primary home market.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 4. Public Contact & Inquiries### POST /api/contactSubmit support or inquiry message.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `contact`- **Request Schema**: `createContactMessage` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 5. Categories Taxonomy### GET /api/categoriesList active product categories with product counts.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 6. Guest & Home Discovery### GET /api/public/homeCurated landing board, featured farmers, and announcements for guests.- **Auth**: `public` (Roles: `Public`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/home/summaryCustomer personalized dashboard summary with ready orders and pickup alerts.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 7. Platform Announcements### GET /api/announcementsList active announcements tailored to caller's role.- **Auth**: `optional` (Roles: `optional`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 8. Markets Directory & Schedules### GET /api/marketsList physical markets with geo or schedule filtering.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/markets/:idGet details for a specific market.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/markets/:id/farmersList farmers attending this market.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/markets/:id/productsList products available at this market.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 9. Farmers Directory & Public Profiles### GET /api/farmersList listed farmers with search and category filters.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/farmers/:idGet farmer profile details.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/farmers/:id/productsList a farmer's catalog products.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/farmers/:id/reviewsList farmer's received customer reviews.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/farmers/:id/pickup-slotsGet upcoming pickup slots for a farmer.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 10. Products Catalog & Details### GET /api/productsBrowse catalog products with filtering, search, and keyset pagination.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/products/:idGet product detail by ID.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/products/:id/reviewsList customer reviews for a specific product.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### GET /api/products/:id/relatedGet related products from farmer and matching categories.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 11. Search Suggestions & Query History### GET /api/search/suggestionsInstant search suggestions for prefixes with at least 2 characters.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/search/historyGet search history for authenticated user.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/search/historyRecord a search history entry.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Request Schema**: `searchHistory` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/search/historyClear all search history.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### DELETE /api/search/history/:idDelete a single search history entry.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 12. Personalized Customer Feed### GET /api/feed/metaHeader greeting and next market opening line.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/feedCurated personalized feed with infinite batch walking.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 13. Cart Quotes & Pricing Validation### POST /api/cart/quoteCalculate live pricing, availability, and pickup slot validation for cart items.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Request Schema**: `cartQuote` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 14. Customer Checkout & Orders### POST /api/orders/checkoutSubmit pre-order checkout with idempotency.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `checkout`- **Request Schema**: `checkout` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/ordersList customer orders with tab filtering and keyset pagination.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/orders/:idGet customer order detail by ID.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### PATCH /api/orders/:idModify order items, note, or pickup slot before cutoff.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Request Schema**: `modifyOrder` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/orders/:id/cancelCancel order before cutoff.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Request Schema**: `cancelOrder` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/orders/:id/reorder-previewPreview availability and pricing to rebuy items from previous order.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### POST /api/orders/:id/reviewsSubmit reviews for farmer and products on completed order.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `review`- **Request Schema**: `orderReviews` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 15. Reviews, Ratings & Moderation Flags### PATCH /api/reviews/:idUpdate customer review within edit window.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `review`- **Request Schema**: `updateReview` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/reviews/:idDelete customer review within edit window.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### POST /api/reviews/:id/flagFlag review for administrative moderation.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `review`- **Request Schema**: `flagReview` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 16. Customer Favorites & Restock Alerts### GET /api/favorites/idsLightweight list of favorited product and farmer IDs.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/favoritesList customer favorite cards by type with pagination.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PUT /api/favorites/:type/:idSave product or farmer to favorites.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/favorites/:type/:idRemove product or farmer from favorites.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 17. Customer Notifications & Alerts### GET /api/notificationsList notifications with unread counts and keyset pagination.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/notifications/read-allMark all notifications as read.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/notifications/:id/readMark a specific notification as read.- **Auth**: `any` (Roles: `customer, farmer, admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 18. Rule-Based Instant Assistant### POST /api/assistant/messageNatural language shopping assistant messaging.- **Auth**: `customer` (Roles: `customer`)- **Rate Limiter**: `assistant`- **Request Schema**: `assistantMessage` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 19. Farmer Stall Profile & Settings### GET /api/farmer/profileRetrieves own farmer stall profile.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PATCH /api/farmer/profileUpdates permitted stall profile fields.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `farmerProfile` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 20. Farmer Pickup Slots & Closures### GET /api/farmer/slotsList upcoming pickup slots with capacity and order counts.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PUT /api/farmer/slots/closuresMark dates closed for pickup.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `slotClosures` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/farmer/slots/closures/:dateReopen a previously closed pickup date.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 21. Farmer Inventory & Product Management### GET /api/farmer/productsList own products with filtering and pagination.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/farmer/productsCreate a new product in farmer catalog.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `createProduct` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/products/bulkExecute bulk availability or quantity changes.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `bulkProducts` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/farmer/products/:idGet product details for catalog management.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### PATCH /api/farmer/products/:idUpdate an existing product.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `updateProduct` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/farmer/products/:idArchive or remove a product from the catalog.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### POST /api/farmer/products/:id/sold-outQuick toggle product to sold-out.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/products/:id/availableRestock product and mark available.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `availableProduct` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/products/:id/hideHide product from public catalog.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/products/:id/unhideUnhide product back into public catalog.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 22. Farmer Weekly Restock Templates### GET /api/farmer/weekly-templateGet weekly inventory template configuration.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PUT /api/farmer/weekly-templateUpdate weekly inventory template configuration.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `weeklyTemplate` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/weekly-template/applyApply weekly inventory template and trigger restock alerts.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 23. Farmer Order Fulfillment & Pick Lists### GET /api/farmer/orders/pick-listGet daily pick list aggregated by product and pickup window.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/farmer/ordersList incoming and past orders for this stall.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/farmer/orders/:idGet detailed view of a customer order for this farmer.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.### POST /api/farmer/orders/:id/acceptAccept placed order.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/orders/:id/declineDecline order with reason and restore inventory.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `declineOrder` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/orders/:id/readyMark order ready for pickup and notify customer.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/orders/:id/completeMark order completed upon in-person pickup and payment.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/farmer/orders/:id/cancelCancel order with reason and restore inventory.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `cancelOrder` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 24. Farmer Review Management & Replies### GET /api/farmer/reviewsList customer reviews received for this stall and products.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/farmer/reviews/:id/replyPost public stall reply to a customer review.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Request Schema**: `replyReview` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/farmer/reviews/:id/replyRemove stall reply from a customer review.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 25. Farmer Analytics & Business Insights### GET /api/farmer/insightsFarmer revenue, orders, and sales insights across date ranges.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/farmer/overviewFarmer daily summary dashboard with action items and earnings.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/farmer/insights/overviewFarmer insights overview with KPIs.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 26. Image Uploads & Static Media### POST /api/farmer/uploads/imageUpload stall or product image with magic-byte validation.- **Auth**: `farmer` (Roles: `farmer`)- **Rate Limiter**: `upload`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 27. Admin Dashboard Overview### GET /api/admin/overviewPlatform-wide administrator overview dashboard metrics.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 28. Admin People & Account Moderation### GET /api/admin/peopleList all people (farmers and customers).- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/admin/farmersList all farmers with approval status filter.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/farmers/:id/approveApprove pending farmer stall.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/farmers/:id/rejectReject pending farmer stall with reason.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `rejectFarmer` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/farmers/:id/suspendSuspend farmer stall and delist products.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `suspendFarmer` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/farmers/:id/reinstateReinstate suspended farmer stall.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### GET /api/admin/customersList all customer accounts with status filter.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/customers/:id/deactivateDeactivate customer account.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/customers/:id/activateReactivate customer account.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 29. Admin Market Venue Management### GET /api/admin/marketsList all markets for administration.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/marketsCreate a new farmers market.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `createMarket` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### PATCH /api/admin/markets/:idUpdate an existing market.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `updateMarket` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/admin/markets/:idRemove a market with force check.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 30. Admin Content Moderation Queue### GET /api/admin/moderationList moderation flags with target preview previews.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/moderation/:id/resolveResolve moderation flag with action.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `resolveModeration` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/products/:id/removeDirect administrative removal and delisting of product.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `removeProduct` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/reviews/:id/removeDirect administrative removal of review and rating reversal.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `removeReview` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 31. Admin Reports & CSV Data Export### GET /api/admin/reports/summaryPlatform sales and GMV metrics by date range.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/admin/reports/exportExport CSV streaming report for orders, products, or farmers.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `export`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### GET /api/admin/reports/sales.csvExport sales CSV report.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `export`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.## 32. Admin Taxonomy & Categories### GET /api/admin/categoriesList categories for administrative management.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/categories/reorderReorder category display sequence.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `reorderCategories` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/categoriesCreate category taxonomy item.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `createCategory` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### PATCH /api/admin/categories/:idUpdate category taxonomy item.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `updateCategory` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/admin/categories/:idDelete category taxonomy item.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 33. Admin Announcement Management### GET /api/admin/announcementsList platform announcements for administration.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/announcementsCreate platform announcement.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `createAnnouncement` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### POST /api/admin/announcements/:id/publishPublish draft announcement.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### PATCH /api/admin/announcements/:idUpdate announcement details.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `updateAnnouncement` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.### DELETE /api/admin/announcements/:idDelete announcement.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.## 34. Admin Support Message Handling### GET /api/admin/messagesList customer contact inquiry messages with status filtering.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### POST /api/admin/messages/:id/handleResolve and reply to contact inquiry message.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `handleContactMessage` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.## 35. Admin Platform Settings & Config### GET /api/admin/settingsGet global platform settings.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.### PATCH /api/admin/settingsUpdate global platform settings.- **Auth**: `admin` (Roles: `admin`)- **Rate Limiter**: `default`- **Request Schema**: `platformSettings` (Strict unknown field rejection)- **Responses**:  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`  - `401 UNAUTHENTICATED` if token missing or invalid.  - `403 FORBIDDEN` if caller lacks required permissions.  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.
=======
# MarketLink API Specification (Stage 5 Contract Freeze)

> **Base URL**: `/api`  
> **Protocol**: HTTP 1.1 / JSON (RESTful)  
> **Success Payload**: `{ "data": <payload>, "meta": { ... } }`  
> **Error Payload**: `{ "error": { "code": "<CODE>", "message": "<MSG>", "details": [ { "field": "<f>", "message": "<m>" } ] } }`  
> **Total Registered Endpoints**: 134

---

## Architecture Conventions & Data Types

1. **Identifiers**: Internal MongoDB `_id` is always projected out and exposed as string `id` (24-hex string). Never expose `_id`.
2. **Monetary Values**: All prices, fees, totals, and line totals are represented strictly as **positive integer cents** (e.g. `$4.50` is `450`). Never use floating-point numbers for currency.
3. **Dates & Timestamps**: Stored as BSON Dates and serialized to ISO 8601 UTC strings (e.g. `2026-09-24T08:00:00.000Z`).
4. **Tenant Isolation & IDOR Protection**: A Customer can never inspect another Customer's orders or favorites. A Farmer can never view or modify another Farmer's inventory, orders, or reviews. Accessing another user's private resource ID returns `404 NOT_FOUND` to prevent resource enumeration.
5. **Strict Input Validation**: All write endpoints strictly reject unknown/unregistered fields with `422 VALIDATION_FAILED`. Operators prefixed with `$` are neutralized by injection sanitization middleware.

---

## Global Pagination Specification

All collection endpoints support keyset (cursor-based) pagination to guarantee stable ordering, prevent duplicate records across page boundaries, and eliminate unbounded offsets.

- **Parameters**:
  - `limit` (optional integer): Number of records per page. Default is `20`, maximum allowed is `50`.
  - `cursor` (optional string): An opaque, tamper-proof base64url token encoding `{ v: 1, s: sortKey, k: [sortValues...], id: docId }` signed with HMAC-SHA256.
- **Response Metadata**:
  ```json
  {
    "meta": {
      "limit": 20,
      "hasMore": true,
      "nextCursor": "eyJ2IjoxLCJzIjoicmVjZW50IiwiayI6WyIyMDI2LTA5LTI0Il0sImlkIjoiNmFiNGQ...""
    }
  }
  ```
- **Boundary Conditions**:
  - When `hasMore` is `false`, `nextCursor` is `null`.
  - Passing an invalid, malformed, or tampered cursor yields `400 INVALID_CURSOR`.

---

## Global Error Codes Reference

The following table documents all machine-readable error codes emitted by MarketLink:

| HTTP Status | Error Code | Trigger Condition / Description |
|:---|:---|:---|
| **400** | `BAD_JSON` | Malformed JSON in request body or invalid syntax. |
| **400** | `INVALID_CURSOR` | Cursor payload tampered, expired, or HMAC signature mismatch. |
| **401** | `UNAUTHENTICATED` | Missing, invalid, or malformed Authorization Bearer header. |
| **401** | `TOKEN_EXPIRED` | Access JWT has expired (15-minute validity window). |
| **401** | `INVALID_CREDENTIALS` | Email not found or password incorrect (constant-time response). |
| **401** | `REFRESH_REUSE_DETECTED` | Revoked refresh token presented; causes immediate eviction of all sessions. |
| **403** | `FORBIDDEN` | Authenticated user lacks required role (e.g. Customer accessing Farmer API). |
| **403** | `ACCOUNT_INACTIVE` | Customer account status is deactivated or inactive. |
| **403** | `ACCOUNT_SUSPENDED` | Farmer stall is suspended or rejected by an administrator. |
| **403** | `FARMER_NOT_APPROVED` | Farmer account is in pending state and cannot publish catalog items. |
| **403** | `CANNOT_MODERATE_ADMIN` | Administrator attempted to suspend or deactivate another Admin. |
| **404** | `NOT_FOUND` | Resource does not exist, or tenant isolation (IDOR) masked as 404. |
| **409** | `EMAIL_TAKEN` | User registration attempted with an already registered email. |
| **409** | `CONFLICT` | General state conflict or duplicate unique field. |
| **409** | `CATEGORY_EXISTS` | Category with the same name or slug already exists. |
| **409** | `CATEGORY_IN_USE` | Attempted to delete a category that still contains products. |
| **409** | `ALREADY_REVIEWED` | Customer already submitted a review for this order/target. |
| **409** | `ALREADY_FLAGGED` | User already reported this review for moderation. |
| **409** | `ORDER_NOT_COMPLETED` | Attempted to review an order that has not been marked completed. |
| **409** | `EDIT_WINDOW_EXPIRED` | Review update attempted after the 14-day edit window elapsed. |
| **409** | `CANNOT_CANCEL` | Order cannot be cancelled once in `ready` or `completed` status. |
| **409** | `SLOT_FULL` | Pickup window capacity has been filled by competing checkout. |
| **409** | `STOCK_DEPLETED` | Product inventory is insufficient to satisfy requested quantity. |
| **409** | `PRICE_CHANGED` | Catalog price changed between cart quote creation and checkout. |
| **409** | `UPLOAD_LIMIT` | Farmer reached the maximum quota of 200 stored images. |
| **409** | `INVALID_STATE` | State machine transition is disallowed for the current status. |
| **413** | `PAYLOAD_TOO_LARGE` | Request body exceeds limit (100KB for JSON, 1MB for media uploads). |
| **422** | `VALIDATION_FAILED` | Schema constraint violated, missing required fields, or unknown fields present. |
| **422** | `INVALID_IMAGE` | Uploaded file failed magic-byte verification (only JPEG, PNG, WebP supported). |
| **422** | `INVALID_RESET_TOKEN` | Password reset token is invalid, expired, or already used. |
| **422** | `RANGE_TOO_LARGE` | Date range parameter exceeds the 366-day administrative threshold. |
| **429** | `RATE_LIMITED` | Request threshold exceeded for route class (standard rate limiter). |
| **429** | `TOO_MANY_ATTEMPTS` | Account lockout: 5 failed login attempts for this email within 15 minutes. |
| **500** | `INTERNAL` | Internal server error. Details suppressed in production environments. |
| **503** | `SERVICE_UNAVAILABLE` | MongoDB connection is offline or unavailable during operational ping. |

---

## 1. System & Health Probes

### GET /api/health
Lightweight load-balancer probe without database overhead.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/ready
Database readiness probe verifying active MongoDB connection.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/version
Backend service name, version, and build info.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 2. Authentication & Session Management

### POST /api/auth/register/customer
Registers a new Customer account.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `register`
- **Request Schema**: `registerCustomer` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/register/farmer
Registers a new Farmer account with initial pending status.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `register`
- **Request Schema**: `registerFarmer` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/login
Signs in an existing user with credential verification and account lockout.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `login`
- **Request Schema**: `login` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/refresh
Rotates refresh token and issues a new access token.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/logout
Terminates the current refresh session and clears cookie.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/auth/me
Returns profile data for the currently authenticated session.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/auth/forgot-password
Generates password reset token and sends email instructions.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `forgot`
- **Request Schema**: `forgotPassword` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/reset-password
Resets user password with valid single-use token.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Request Schema**: `resetPassword` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/auth/verify-email
Verifies email address with single-use token.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Request Schema**: `verifyEmail` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if token is invalid, expired, or already used.

### GET /api/auth/verify-email
Verifies email address via GET token query param.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if token is invalid, expired, or already used.

### POST /api/auth/resend-verification
Resends email verification link if unverified (rate-limited).

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Request Schema**: `resendVerification` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.
  - `429 RATE_LIMITED` if resend rate limit (3/hour) is exceeded.

### GET /api/auth/_ping/customer
RBAC verification ping for customer role.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/auth/_ping/farmer
RBAC verification ping for farmer role.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/auth/_ping/admin
RBAC verification ping for admin role.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 3. Customer Profile & Account Settings

### GET /api/users/me
Get full profile of authenticated user.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PATCH /api/users/me
Update permitted profile fields.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `updateUserProfile` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/users/me/password
Change account password.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `changePassword` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/users/me/sessions
Sign out of all devices and revoke all refresh sessions.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/users/me/saved-markets
List saved markets for authenticated user.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PUT /api/users/me/saved-markets/:marketId
Save a market to bookmarks (max 10).

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/users/me/saved-markets/:marketId
Remove market from saved bookmarks.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### PUT /api/users/me/home-market/:marketId
Set primary home market.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 4. Public Contact & Inquiries

### POST /api/contact
Submit support or inquiry message.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `contact`
- **Request Schema**: `createContactMessage` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 5. Categories Taxonomy

### GET /api/categories
List active product categories with product counts.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 6. Guest & Home Discovery

### GET /api/public/home
Curated landing board, featured farmers, and announcements for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/markets
Browse markets for unauthenticated guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/markets/:id
Get public market details for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/markets/:id/farmers
List attending farmers at market for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/markets/:id/products
Browse products available at market for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/farmers
Browse farmer stalls for unauthenticated guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/farmers/:id
Get public farmer stall details for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/farmers/:id/products
Browse farmer products for unauthenticated guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/farmers/:id/reviews
Read reviews for a farmer stall as guest.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/farmers/:id/pickup-slots
Get available pickup slots for a farmer stall as guest.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/products
Browse catalog products for unauthenticated guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/products/:id
Get public product details for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/products/:id/reviews
Read reviews for a product as guest.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/public/products/:id/related
Get related products from same farmer or category for guests.

- **Auth**: `public` (Roles: `Public`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/home/summary
Customer personalized dashboard summary with ready orders and pickup alerts.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 7. Platform Announcements

### GET /api/announcements
List active announcements tailored to caller's role.

- **Auth**: `optional` (Roles: `optional`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 8. Markets Directory & Schedules

### GET /api/markets
List physical markets with geo or schedule filtering.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/markets/:id
Get details for a specific market.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/markets/:id/farmers
List farmers attending this market.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/markets/:id/products
List products available at this market.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 9. Farmers Directory & Public Profiles

### GET /api/farmers
List listed farmers with search and category filters.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/farmers/:id
Get farmer profile details.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/farmers/:id/products
List a farmer's catalog products.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/farmers/:id/reviews
List farmer's received customer reviews.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/farmers/:id/pickup-slots
Get upcoming pickup slots for a farmer.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 10. Products Catalog & Details

### GET /api/products
Browse catalog products with filtering, search, and keyset pagination.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/products/:id
Get product detail by ID.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/products/:id/reviews
List customer reviews for a specific product.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### GET /api/products/:id/related
Get related products from farmer and matching categories.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 11. Search Suggestions & Query History

### GET /api/search/suggestions
Instant search suggestions for prefixes with at least 2 characters.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/search/history
Get search history for authenticated user.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/search/history
Record a search history entry.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `searchHistory` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/search/history
Clear all search history.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### DELETE /api/search/history/:id
Delete a single search history entry.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 12. Personalized Customer Feed

### GET /api/feed/meta
Header greeting and next market opening line.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/feed
Curated personalized feed with infinite batch walking.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 13. Cart Quotes & Pricing Validation

### POST /api/cart/quote
Calculate live pricing, availability, and pickup slot validation for cart items.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Request Schema**: `cartQuote` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 14. Customer Checkout & Orders

### POST /api/orders/checkout
Submit pre-order checkout with idempotency.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `checkout`
- **Request Schema**: `checkout` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/orders
List customer orders with tab filtering and keyset pagination.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/orders/:id
Get customer order detail by ID.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### PATCH /api/orders/:id
Modify order items, note, or pickup slot before cutoff.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Request Schema**: `modifyOrder` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/orders/:id/cancel
Cancel order before cutoff.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Request Schema**: `cancelOrder` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/orders/:id/reorder-preview
Preview availability and pricing to rebuy items from previous order.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### POST /api/orders/:id/reviews
Submit reviews for farmer and products on completed order.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `review`
- **Request Schema**: `orderReviews` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 15. Reviews, Ratings & Moderation Flags

### PATCH /api/reviews/:id
Update customer review within edit window.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `review`
- **Request Schema**: `updateReview` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/reviews/:id
Delete customer review within edit window.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### POST /api/reviews/:id/flag
Flag review for administrative moderation.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `review`
- **Request Schema**: `flagReview` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 16. Customer Favorites & Restock Alerts

### GET /api/favorites/ids
Lightweight list of favorited product and farmer IDs.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/favorites
List customer favorite cards by type with pagination.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PUT /api/favorites/:type/:id
Save product or farmer to favorites.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/favorites/:type/:id
Remove product or farmer from favorites.

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 17. Customer Notifications & Alerts

### GET /api/notifications
List notifications with unread counts and keyset pagination.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/notifications/read-all
Mark all notifications as read.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/notifications/:id/read
Mark a specific notification as read.

- **Auth**: `any` (Roles: `customer, farmer, admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 18. Rule-Based Instant Assistant

### POST /api/assistant/message
Natural language shopping assistant messaging with optional Server-Sent Events streaming (`?stream=1`).

- **Auth**: `customer` (Roles: `customer`)
- **Rate Limiter**: `assistant`
- **Query Parameters**:
  - `stream` (optional): `1` or `true` to enable Server-Sent Events (SSE) streaming (`Content-Type: text/event-stream`).
- **Request Schema**: `assistantMessage` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` on success:
    - Standard JSON: `{ "data": { "reply": "...", "cards": [...], "suggestions": [...] } }`
    - Streaming SSE (`?stream=1`): event stream emitting `data: {"chunk": "..."}` fragments and ending with `data: {"done": true, ...}`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.
  - `503 SERVICE_UNAVAILABLE` with code `ASSISTANT_BUSY` if all keys are cooling down and rule-based fallback fails.



## 19. Farmer Stall Profile & Settings

### GET /api/farmer/profile
Retrieves own farmer stall profile.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PATCH /api/farmer/profile
Updates permitted stall profile fields.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `farmerProfile` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 20. Farmer Pickup Slots & Closures

### GET /api/farmer/slots
List upcoming pickup slots with capacity and order counts.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PUT /api/farmer/slots/closures
Mark dates closed for pickup.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `slotClosures` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/farmer/slots/closures/:date
Reopen a previously closed pickup date.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 21. Farmer Inventory & Product Management

### GET /api/farmer/products
List own products with filtering and pagination.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/farmer/products
Create a new product in farmer catalog.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `createProduct` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/products/bulk
Execute bulk availability or quantity changes.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `bulkProducts` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/farmer/products/:id
Get product details for catalog management.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### PATCH /api/farmer/products/:id
Update an existing product.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `updateProduct` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/farmer/products/:id
Archive or remove a product from the catalog.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### POST /api/farmer/products/:id/sold-out
Quick toggle product to sold-out.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/products/:id/available
Restock product and mark available.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `availableProduct` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/products/:id/hide
Hide product from public catalog.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/products/:id/unhide
Unhide product back into public catalog.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 22. Farmer Weekly Restock Templates

### GET /api/farmer/weekly-template
Get weekly inventory template configuration.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PUT /api/farmer/weekly-template
Update weekly inventory template configuration.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `weeklyTemplate` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/weekly-template/apply
Apply weekly inventory template and trigger restock alerts.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 23. Farmer Order Fulfillment & Pick Lists

### GET /api/farmer/orders/pick-list
Get daily pick list aggregated by product and pickup window.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/farmer/orders
List incoming and past orders for this stall.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/farmer/orders/:id
Get detailed view of a customer order for this farmer.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.

### POST /api/farmer/orders/:id/accept
Accept placed order.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/orders/:id/decline
Decline order with reason and restore inventory.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `declineOrder` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/orders/:id/ready
Mark order ready for pickup and notify customer.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/orders/:id/complete
Mark order completed upon in-person pickup and payment.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/farmer/orders/:id/cancel
Cancel order with reason and restore inventory.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `cancelOrder` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 24. Farmer Review Management & Replies

### GET /api/farmer/reviews
List customer reviews received for this stall and products.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/farmer/reviews/:id/reply
Post public stall reply to a customer review.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Request Schema**: `replyReview` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/farmer/reviews/:id/reply
Remove stall reply from a customer review.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 25. Farmer Analytics & Business Insights

### GET /api/farmer/insights
Farmer revenue, orders, and sales insights across date ranges.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/farmer/overview
Farmer daily summary dashboard with action items and earnings.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/farmer/insights/overview
Farmer insights overview with KPIs.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 26. Image Uploads & Static Media

### POST /api/farmer/uploads/image
Upload stall or product image with magic-byte validation.

- **Auth**: `farmer` (Roles: `farmer`)
- **Rate Limiter**: `upload`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 27. Admin Dashboard Overview

### GET /api/admin/overview
Platform-wide administrator overview dashboard metrics.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 28. Admin People & Account Moderation

### GET /api/admin/people
List all people (farmers and customers).

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/admin/farmers
List all farmers with approval status filter.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/farmers/:id/approve
Approve pending farmer stall.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/farmers/:id/reject
Reject pending farmer stall with reason.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `rejectFarmer` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/farmers/:id/suspend
Suspend farmer stall and delist products.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `suspendFarmer` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/farmers/:id/reinstate
Reinstate suspended farmer stall.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/admin/customers
List all customer accounts with status filter.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/customers/:id/deactivate
Deactivate customer account.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/customers/:id/activate
Reactivate customer account.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 29. Admin Market Venue Management

### GET /api/admin/markets
List all markets for administration.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/markets
Create a new farmers market.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `createMarket` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### PATCH /api/admin/markets/:id
Update an existing market.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `updateMarket` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/admin/markets/:id
Remove a market with force check.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 30. Admin Content Moderation Queue

### GET /api/admin/moderation
List moderation flags with target preview previews.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/moderation/:id/resolve
Resolve moderation flag with action.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `resolveModeration` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/products/:id/remove
Direct administrative removal and delisting of product.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `removeProduct` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/reviews/:id/remove
Direct administrative removal of review and rating reversal.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `removeReview` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 31. Admin Reports & CSV Data Export

### GET /api/admin/reports/summary
Platform sales and GMV metrics by date range.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/admin/reports/history
List recent administrative CSV export generation history.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/admin/reports/export
Export CSV streaming report for orders, products, or farmers.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `export`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/admin/reports/sales.csv
Export sales CSV report.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `export`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.


## 32. Admin Taxonomy & Categories

### GET /api/admin/categories
List categories for administrative management.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/categories/reorder
Reorder category display sequence.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `reorderCategories` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### PUT /api/admin/categories/order
Reorder category display sequence via PUT.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `reorderCategories` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/categories
Create category taxonomy item.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `createCategory` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### PATCH /api/admin/categories/:id
Update category taxonomy item.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `updateCategory` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/admin/categories/:id
Delete category taxonomy item.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 33. Admin Announcement Management

### GET /api/admin/announcements
List platform announcements for administration.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/announcements
Create platform announcement.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `createAnnouncement` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### POST /api/admin/announcements/:id/publish
Publish draft announcement.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### PATCH /api/admin/announcements/:id
Update announcement details.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `updateAnnouncement` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### DELETE /api/admin/announcements/:id
Delete announcement.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.


## 34. Admin Support Message Handling

### GET /api/admin/messages
List customer contact inquiry messages with status filtering.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### POST /api/admin/messages/:id/handle
Resolve and reply to contact inquiry message.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `handleContactMessage` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `404 NOT_FOUND` if resource id is not found or owned by another tenant.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.


## 35. Admin Platform Settings & Config

### GET /api/admin/settings
Get global platform settings.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### PATCH /api/admin/settings
Update global platform settings.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Request Schema**: `platformSettings` (Strict unknown field rejection)
- **Responses**:
  - `200 OK` / `201 Created` / `204 No Content` on success: `{ "data": ... }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.
  - `422 VALIDATION_FAILED` if request body contains invalid or unknown fields.

### GET /api/admin/assistant/status
Get masked Gemini API key pool health and quota status.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` on success: `{ "data": [{ "index": 0, "maskedKey": "AQ.A...4WXw", "cooldownUntil": 0, "consecutiveErrors": 0, "requestsLastMinute": 0 }] }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.

### GET /api/admin/email-log
List email delivery logs with tag/status filter and cursor pagination.

- **Auth**: `admin` (Roles: `admin`)
- **Rate Limiter**: `default`
- **Responses**:
  - `200 OK` on success: `{ "data": { "items": [...], "nextCursor": null, "stats": { "sentToday": 0, "dailyLimit": 450 } } }`
  - `401 UNAUTHENTICATED` if token missing or invalid.
  - `403 FORBIDDEN` if caller lacks required permissions.



>>>>>>> bc73418815cde522512fe21a2af884eee3163165
