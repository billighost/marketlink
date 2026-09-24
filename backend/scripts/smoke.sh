#!/usr/bin/env bash
# MarketLink Backend Smoke Test Script (Linux/macOS)
# Runs a full end-to-end smoke test flow against a running server:
# health -> register customer -> me -> refresh -> logout -> login as George -> patch profile -> forgot password -> contact form.

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

echo ""
echo "========================================================"
echo "🎉  All smoke test steps passed successfully!"
echo "========================================================"
