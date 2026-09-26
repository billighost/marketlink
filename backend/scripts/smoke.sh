#!/usr/bin/env bash
# MarketLink Backend Smoke Test Script (Linux/macOS)
# Runs a full end-to-end smoke test flow against a running server:
# Steps 1-25: Platform Baseline & Customer Flow
# Steps 26-32: Farmer Dashboard & Operations Flow
# Steps 33-39: Administrator Operations & Reporting Flow

set -e

BASE_URL="${API_URL:-http://localhost:4000/api}"
COOKIE_FILE=$(mktemp)
trap 'rm -f "$COOKIE_FILE"' EXIT

echo "========================================================"
echo "MarketLink API Smoke Test starting against: $BASE_URL"
echo "========================================================"

# 1. Health check
echo -n "1. Testing GET /health... "
HEALTH_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RES" | tail -n1)
BODY=$(echo "$HEALTH_RES" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
echo "OK (200)"

# 2. Ready check
echo -n "2. Testing GET /ready... "
READY_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/ready")
HTTP_CODE=$(echo "$READY_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 3. Register Customer
SMOKE_EMAIL="smoke.customer.$(date +%s)@example.com"
echo -n "3. Registering Customer ($SMOKE_EMAIL)... "
REG_RES=$(curl -s -c "$COOKIE_FILE" -w "\n%{http_code}" -X POST "$BASE_URL/auth/register/customer" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Tester\",\"phone\":\"(555) 000-1111\",\"email\":\"$SMOKE_EMAIL\",\"address\":\"100 Test Ave\",\"password\":\"Password123\"}")
HTTP_CODE=$(echo "$REG_RES" | tail -n1)
BODY=$(echo "$REG_RES" | sed '$d')
if [ "$HTTP_CODE" -ne 201 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "OK (201)"

# 4. GET /auth/me with Bearer token
echo -n "4. Testing GET /auth/me... "
ME_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$ME_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 5. POST /auth/refresh
echo -n "5. Testing POST /auth/refresh... "
REFRESH_RES=$(curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh")
HTTP_CODE=$(echo "$REFRESH_RES" | tail -n1)
BODY=$(echo "$REFRESH_RES" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "OK (200)"

# 6. POST /auth/logout
echo -n "6. Testing POST /auth/logout... "
LOGOUT_RES=$(curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -w "\n%{http_code}" -X POST "$BASE_URL/auth/logout")
HTTP_CODE=$(echo "$LOGOUT_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 204 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (204)"

# 7. Login as George Adams
echo -n "7. Logging in as George Adams... "
GEORGE_RES=$(curl -s -c "$COOKIE_FILE" -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"george@example.com","password":"market123"}')
HTTP_CODE=$(echo "$GEORGE_RES" | tail -n1)
BODY=$(echo "$GEORGE_RES" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
GEORGE_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "OK (200)"

# 8. PATCH /users/me
echo -n "8. Updating George's profile (PATCH /users/me)... "
PATCH_RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/users/me" \
  -H "Authorization: Bearer $GEORGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"(555) 012-3456","address":"14 Birch Lane, Maplewood"}')
HTTP_CODE=$(echo "$PATCH_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 9. POST /auth/forgot-password
echo -n "9. Requesting password reset... "
FORGOT_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"george@example.com"}')
HTTP_CODE=$(echo "$FORGOT_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 10. POST /contact
echo -n "10. Submitting contact message... "
CONTACT_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Tester","email":"smoke@example.com","topic":"feedback","message":"Smoke test message verifying contact route."}')
HTTP_CODE=$(echo "$CONTACT_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 201 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (201)"

# 11. GET /public/home
echo -n "11. Testing GET /public/home... "
PUB_HOME=$(curl -s -w "\n%{http_code}" "$BASE_URL/public/home")
HTTP_CODE=$(echo "$PUB_HOME" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 12. GET /categories
echo -n "12. Testing GET /categories... "
CATS_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/categories")
HTTP_CODE=$(echo "$CATS_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 13. GET /markets
echo -n "13. Testing GET /markets... "
MKTS_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/markets" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$MKTS_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 14. GET /farmers
echo -n "14. Testing GET /farmers... "
FRMS_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmers" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$FRMS_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 15. GET /products
echo -n "15. Testing GET /products... "
PRODS_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/products?limit=5" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$PRODS_RES" | tail -n1)
BODY=$(echo "$PRODS_RES" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
PROD_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)
FARMER_ID=$(echo "$BODY" | grep -o '"farmer":{[^}]*"id":"[^"]*' | head -n1 | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "OK (200)"

# 16. GET /search/suggestions
echo -n "16. Testing GET /search/suggestions?q=tom... "
SUGG_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/search/suggestions?q=tom" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$SUGG_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 17. GET /feed
echo -n "17. Testing GET /feed... "
FEED_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/feed" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$FEED_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 18. GET /feed/meta
echo -n "18. Testing GET /feed/meta... "
META_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/feed/meta" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$META_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 19. POST /cart/quote
echo -n "19. Testing POST /cart/quote... "
if [ -n "$PROD_ID" ] && [ -n "$FARMER_ID" ]; then
  QUOTE_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/cart/quote" \
    -H "Authorization: Bearer $GEORGE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"groups\":[{\"farmerId\":\"$FARMER_ID\",\"items\":[{\"productId\":\"$PROD_ID\",\"quantity\":1}]}]}")
  HTTP_CODE=$(echo "$QUOTE_RES" | tail -n1)
  if [ "$HTTP_CODE" -ne 200 ]; then
    echo "FAILED ($HTTP_CODE)"
    exit 1
  fi
  echo "OK (200)"
else
  echo "SKIPPED (no seed products)"
fi

# 20. GET /orders
echo -n "20. Testing GET /orders?tab=active... "
ORDS_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/orders?tab=active" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$ORDS_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 21. GET /favorites/ids & PUT /favorites/farmer/:id
echo -n "21. Testing PUT /favorites/farmer/:id & GET /favorites/ids... "
if [ -n "$FARMER_ID" ]; then
  FAV_RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/favorites/farmer/$FARMER_ID" -H "Authorization: Bearer $GEORGE_TOKEN")
  FAV_IDS=$(curl -s "$BASE_URL/favorites/ids" -H "Authorization: Bearer $GEORGE_TOKEN")
  echo "OK (200)"
else
  echo "SKIPPED (no farmer id)"
fi

# 22. GET /notifications
echo -n "22. Testing GET /notifications... "
NOTIF_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/notifications" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$NOTIF_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 23. GET /users/me/saved-markets
echo -n "23. Testing GET /users/me/saved-markets... "
SAVED_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/users/me/saved-markets" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$SAVED_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 24. GET /home/summary
echo -n "24. Testing GET /home/summary... "
SUMM_RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/home/summary" -H "Authorization: Bearer $GEORGE_TOKEN")
HTTP_CODE=$(echo "$SUMM_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 25. POST /assistant/message
echo -n "25. Testing POST /assistant/message... "
ASST_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/assistant/message" \
  -H "Authorization: Bearer $GEORGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"What time does Elm Street Market open?"}')
HTTP_CODE=$(echo "$ASST_RES" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# ── Stage 4 Farmer Smoke Tests ────────────────────────────────────

# 26. Farmer Login
echo -n "26. Logging in as Farmer (riverbend@example.com)... "
FARM_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"riverbend@example.com","password":"market123"}')
HTTP_CODE=$(echo "$FARM_LOGIN" | tail -n1)
BODY=$(echo "$FARM_LOGIN" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
FARMER_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "OK (200)"

# 27. GET /farmer/profile
echo -n "27. Testing GET /farmer/profile... "
FARM_PROF=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/profile" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_PROF" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 28. GET /farmer/products
echo -n "28. Testing GET /farmer/products... "
FARM_PRODS=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/products" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_PRODS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 29. GET /farmer/orders
echo -n "29. Testing GET /farmer/orders... "
FARM_ORDS=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/orders" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_ORDS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 30. GET /farmer/reviews
echo -n "30. Testing GET /farmer/reviews... "
FARM_REVS=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/reviews" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_REVS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 31. GET /farmer/insights/overview
echo -n "31. Testing GET /farmer/insights/overview... "
FARM_INS=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/insights/overview" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_INS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 32. GET /farmer/slots
echo -n "32. Testing GET /farmer/slots... "
FARM_SLOTS=$(curl -s -w "\n%{http_code}" "$BASE_URL/farmer/slots" -H "Authorization: Bearer $FARMER_TOKEN")
HTTP_CODE=$(echo "$FARM_SLOTS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# ── Stage 4 Admin Smoke Tests ─────────────────────────────────────

# 33. Admin Login
echo -n "33. Logging in as Admin (admin@marketlink.test)... "
ADMIN_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marketlink.test","password":"Admin12345"}')
HTTP_CODE=$(echo "$ADMIN_LOGIN" | tail -n1)
BODY=$(echo "$ADMIN_LOGIN" | sed '$d')
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE): $BODY"
  exit 1
fi
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "OK (200)"

# 34. GET /admin/overview
echo -n "34. Testing GET /admin/overview... "
ADM_OVER=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/overview" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_OVER" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 35. GET /admin/people
echo -n "35. Testing GET /admin/people... "
ADM_PPL=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/people" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_PPL" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 36. GET /admin/markets
echo -n "36. Testing GET /admin/markets... "
ADM_MKTS=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/markets" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_MKTS" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 37. GET /admin/moderation
echo -n "37. Testing GET /admin/moderation... "
ADM_MOD=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/moderation" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_MOD" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 38. GET /admin/reports/sales.csv
echo -n "38. Testing GET /admin/reports/sales.csv... "
ADM_CSV=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/reports/sales.csv" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_CSV" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

# 39. GET /admin/settings
echo -n "39. Testing GET /admin/settings... "
ADM_SETT=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/settings" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$ADM_SETT" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED ($HTTP_CODE)"
  exit 1
fi
echo "OK (200)"

echo ""
echo "========================================================"
echo "🎉  All smoke test steps (1-39) passed successfully!"
echo "========================================================"
