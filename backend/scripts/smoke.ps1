# MarketLink Backend Smoke Test Script (PowerShell for Windows)
# Runs a full end-to-end smoke test flow against a running server:
# health -> register customer -> me -> refresh -> logout -> login as George -> patch profile -> forgot password -> contact form.

$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:API_URL) { $env:API_URL } else { "http://localhost:4000/api" }
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "MarketLink API Smoke Test starting against: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. GET /health
Write-Host -NoNewline "1. Testing GET /health... "
$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
if ($health.data.status -eq "ok") {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 2. GET /ready
Write-Host -NoNewline "2. Testing GET /ready... "
$ready = Invoke-RestMethod -Uri "$BaseUrl/ready" -Method Get
if ($ready.data.status -eq "ready") {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 3. Register Customer
$Email = "smoke.customer.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
Write-Host -NoNewline "3. Registering Customer ($Email)... "
$regBody = @{
    name = "Smoke Tester"
    phone = "(555) 000-1111"
    email = $Email
    address = "100 Test Ave"
    password = "Password123"
} | ConvertTo-Json

$regRes = Invoke-WebRequest -Uri "$BaseUrl/auth/register/customer" -Method Post -Body $regBody -ContentType "application/json" -WebSession $Session
if ($regRes.StatusCode -eq 201) {
    $regData = $regRes.Content | ConvertFrom-Json
    $Token = $regData.data.accessToken
    Write-Host "OK (201)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($regRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 4. GET /auth/me
Write-Host -NoNewline "4. Testing GET /auth/me... "
$meHeaders = @{ Authorization = "Bearer $Token" }
$me = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method Get -Headers $meHeaders -WebSession $Session
if ($me.data.user.email -eq $Email.ToLower()) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 5. POST /auth/refresh
Write-Host -NoNewline "5. Testing POST /auth/refresh... "
$refreshRes = Invoke-WebRequest -Uri "$BaseUrl/auth/refresh" -Method Post -WebSession $Session
if ($refreshRes.StatusCode -eq 200) {
    $refreshData = $refreshRes.Content | ConvertFrom-Json
    $Token = $refreshData.data.accessToken
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($refreshRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 6. POST /auth/logout
Write-Host -NoNewline "6. Testing POST /auth/logout... "
$logoutRes = Invoke-WebRequest -Uri "$BaseUrl/auth/logout" -Method Post -WebSession $Session
if ($logoutRes.StatusCode -eq 204) {
    Write-Host "OK (204)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($logoutRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 7. Login as George Adams
Write-Host -NoNewline "7. Logging in as George Adams... "
$loginBody = @{
    email = "george@example.com"
    password = "market123"
} | ConvertTo-Json

$loginRes = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $Session
if ($loginRes.StatusCode -eq 200) {
    $loginData = $loginRes.Content | ConvertFrom-Json
    $GeorgeToken = $loginData.data.accessToken
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($loginRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 8. PATCH /users/me
Write-Host -NoNewline "8. Updating George's profile (PATCH /users/me)... "
$patchBody = @{
    phone = "(555) 012-3456"
    address = "14 Birch Lane, Maplewood"
} | ConvertTo-Json

$patchHeaders = @{ Authorization = "Bearer $GeorgeToken" }
$patchRes = Invoke-WebRequest -Uri "$BaseUrl/users/me" -Method Patch -Headers $patchHeaders -Body $patchBody -ContentType "application/json" -WebSession $Session
if ($patchRes.StatusCode -eq 200) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($patchRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 9. POST /auth/forgot-password
Write-Host -NoNewline "9. Requesting password reset... "
$forgotBody = @{ email = "george@example.com" } | ConvertTo-Json
$forgotRes = Invoke-WebRequest -Uri "$BaseUrl/auth/forgot-password" -Method Post -Body $forgotBody -ContentType "application/json"
if ($forgotRes.StatusCode -eq 200) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($forgotRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 10. POST /contact
Write-Host -NoNewline "10. Submitting contact message... "
$contactBody = @{
    name = "Smoke Tester"
    email = "smoke@example.com"
    topic = "feedback"
    message = "Smoke test verifying contact form submission."
} | ConvertTo-Json

$contactRes = Invoke-WebRequest -Uri "$BaseUrl/contact" -Method Post -Body $contactBody -ContentType "application/json"
if ($contactRes.StatusCode -eq 201) {
    Write-Host "OK (201)" -ForegroundColor Green
} else {
    Write-Host "FAILED ($($contactRes.StatusCode))" -ForegroundColor Red; exit 1
}

# 11. GET /public/home
Write-Host -NoNewline "11. Testing GET /public/home... "
$publicHome = Invoke-RestMethod -Uri "$BaseUrl/public/home" -Method Get
if ($publicHome.data.board) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 12. GET /categories
Write-Host -NoNewline "12. Testing GET /categories... "
$cats = Invoke-RestMethod -Uri "$BaseUrl/categories" -Method Get
if ($cats.data.Count -gt 0) {
    Write-Host "OK (200 - $($cats.data.Count) categories)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 13. GET /markets
Write-Host -NoNewline "13. Testing GET /markets... "
$markets = Invoke-RestMethod -Uri "$BaseUrl/markets" -Method Get -Headers $patchHeaders
if ($markets.data.Count -gt 0) {
    Write-Host "OK (200 - $($markets.data.Count) markets)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 14. GET /farmers
Write-Host -NoNewline "14. Testing GET /farmers... "
$farmers = Invoke-RestMethod -Uri "$BaseUrl/farmers" -Method Get -Headers $patchHeaders
if ($farmers.data.Count -gt 0) {
    Write-Host "OK (200 - $($farmers.data.Count) farmers)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 15. GET /products
Write-Host -NoNewline "15. Testing GET /products... "
$products = Invoke-RestMethod -Uri "$BaseUrl/products?limit=5" -Method Get -Headers $patchHeaders
if ($products.data.Count -gt 0) {
    Write-Host "OK (200 - $($products.data.Count) products)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 16. GET /search/suggestions
Write-Host -NoNewline "16. Testing GET /search/suggestions?q=tom... "
$suggestions = Invoke-RestMethod -Uri "$BaseUrl/search/suggestions?q=tom" -Method Get -Headers $patchHeaders
if ($suggestions.data.products) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 17. GET /feed
Write-Host -NoNewline "17. Testing GET /feed (Batch 0)... "
$feed = Invoke-RestMethod -Uri "$BaseUrl/feed" -Method Get -Headers $patchHeaders
if ($feed.data.sections.Count -gt 0) {
    Write-Host "OK (200 - $($feed.data.sections.Count) sections)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 18. GET /feed/meta
Write-Host -NoNewline "18. Testing GET /feed/meta... "
$feedMeta = Invoke-RestMethod -Uri "$BaseUrl/feed/meta" -Method Get -Headers $patchHeaders
if ($feedMeta.data.greetingName -eq "George") {
    Write-Host "OK (200 - '$($feedMeta.data.line)')" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🎉  All smoke test steps passed successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
