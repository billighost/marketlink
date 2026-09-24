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

# 19. POST /cart/quote
Write-Host -NoNewline "19. Testing POST /cart/quote... "
$productId = $products.data[0].id
$farmerId = $products.data[0].farmer.id
$quoteBody = @{
    groups = @(
        @{
            farmerId = $farmerId
            items = @(
                @{
                    productId = $productId
                    quantity = 1
                }
            )
        }
    )
} | ConvertTo-Json -Depth 5

$quote = Invoke-RestMethod -Uri "$BaseUrl/cart/quote" -Method Post -Headers $patchHeaders -Body $quoteBody -ContentType "application/json"
if ($quote.data.totalCents -ge 0 -and $quote.data.groups) {
    Write-Host "OK (200 - total: $($quote.data.totalCents)c)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 20. GET /orders
Write-Host -NoNewline "20. Testing GET /orders?tab=active... "
$orders = Invoke-RestMethod -Uri "$BaseUrl/orders?tab=active" -Method Get -Headers $patchHeaders
if ($orders.data) {
    Write-Host "OK (200 - $(@($orders.data).Count) active orders)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 21. GET /favorites/ids & PUT /favorites/farmer/:id
Write-Host -NoNewline "21. Testing PUT /favorites/farmer/:id & GET /favorites/ids... "
$favRes = Invoke-WebRequest -Uri "$BaseUrl/favorites/farmer/$farmerId" -Method Put -Headers $patchHeaders -WebSession $Session
$favIds = Invoke-RestMethod -Uri "$BaseUrl/favorites/ids" -Method Get -Headers $patchHeaders -WebSession $Session
if ($favRes.StatusCode -eq 200 -and (@($favIds.data.farmerIds) -contains $farmerId)) {
    Write-Host "OK (200)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 22. GET /notifications
Write-Host -NoNewline "22. Testing GET /notifications... "
$notifs = Invoke-RestMethod -Uri "$BaseUrl/notifications" -Method Get -Headers $patchHeaders
if ($notifs.data) {
    Write-Host "OK (200 - unread: $($notifs.meta.unreadCount))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 23. GET /users/me/saved-markets
Write-Host -NoNewline "23. Testing GET /users/me/saved-markets... "
$savedMarkets = Invoke-RestMethod -Uri "$BaseUrl/users/me/saved-markets" -Method Get -Headers $patchHeaders
if ($savedMarkets.data) {
    Write-Host "OK (200 - $($savedMarkets.data.Count) saved markets)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 24. GET /home/summary
Write-Host -NoNewline "24. Testing GET /home/summary... "
$homeSummary = Invoke-RestMethod -Uri "$BaseUrl/home/summary" -Method Get -Headers $patchHeaders
if ($homeSummary.data.readyForPickup -or $homeSummary.data.nextPickup) {
    Write-Host "OK (200 - nextPickup: $($homeSummary.data.nextPickup.status))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 25. POST /assistant/message
Write-Host -NoNewline "25. Testing POST /assistant/message... "
$asstBody = @{
    text = "What time does Elm Street Market open?"
} | ConvertTo-Json

$asstRes = Invoke-RestMethod -Uri "$BaseUrl/assistant/message" -Method Post -Headers $patchHeaders -Body $asstBody -ContentType "application/json"
if ($asstRes.data.reply -and $asstRes.data.suggestions) {
    Write-Host "OK (200 - cards: $($asstRes.data.cards.Count))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# ── Stage 4 Smoke Tests ──────────────────────────────────────────

# 26. Farmer Login (Riverbend Farm)
Write-Host -NoNewline "26. Logging in as Farmer (riverbend@example.com)... "
$farmerLoginBody = @{
    email = "riverbend@example.com"
    password = "market123"
} | ConvertTo-Json
$farmerLoginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $farmerLoginBody -ContentType "application/json"
$farmerToken = $farmerLoginRes.data.accessToken
$farmerHeaders = @{ Authorization = "Bearer $farmerToken" }
Write-Host "OK (200)" -ForegroundColor Green

# 27. GET /farmer/profile
Write-Host -NoNewline "27. Testing GET /farmer/profile... "
$farmerProfile = Invoke-RestMethod -Uri "$BaseUrl/farmer/profile" -Method Get -Headers $farmerHeaders
if ($farmerProfile.data.stallName -eq "Riverbend Farm") {
    Write-Host "OK (200 - $($farmerProfile.data.stallName))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 28. GET /farmer/products
Write-Host -NoNewline "28. Testing GET /farmer/products... "
$farmerProds = Invoke-RestMethod -Uri "$BaseUrl/farmer/products" -Method Get -Headers $farmerHeaders
if ($farmerProds.data.Count -gt 0) {
    Write-Host "OK (200 - $($farmerProds.data.Count) products)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 29. GET /farmer/orders
Write-Host -NoNewline "29. Testing GET /farmer/orders... "
$farmerOrds = Invoke-RestMethod -Uri "$BaseUrl/farmer/orders" -Method Get -Headers $farmerHeaders
if ($farmerOrds.data) {
    Write-Host "OK (200 - $($farmerOrds.data.Count) orders)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 30. GET /farmer/reviews
Write-Host -NoNewline "30. Testing GET /farmer/reviews... "
$farmerRevs = Invoke-RestMethod -Uri "$BaseUrl/farmer/reviews" -Method Get -Headers $farmerHeaders
if ($farmerRevs.data) {
    Write-Host "OK (200 - $($farmerRevs.data.Count) reviews)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 31. GET /farmer/insights/overview
Write-Host -NoNewline "31. Testing GET /farmer/insights/overview... "
$farmerInsights = Invoke-RestMethod -Uri "$BaseUrl/farmer/insights/overview" -Method Get -Headers $farmerHeaders
if ($farmerInsights.data.kpis) {
    Write-Host "OK (200 - revenue: `$$([math]::Round($farmerInsights.data.kpis.revenueCents / 100, 2)))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 32. GET /farmer/slots
Write-Host -NoNewline "32. Testing GET /farmer/slots... "
$farmerSlots = Invoke-RestMethod -Uri "$BaseUrl/farmer/slots" -Method Get -Headers $farmerHeaders
if ($farmerSlots.data) {
    Write-Host "OK (200 - $($farmerSlots.data.Count) upcoming slots)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 33. Admin Login
Write-Host -NoNewline "33. Logging in as Admin (admin@marketlink.test)... "
$adminLoginBody = @{
    email = "admin@marketlink.test"
    password = "Admin12345"
} | ConvertTo-Json
$adminLoginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminLoginRes.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "OK (200)" -ForegroundColor Green

# 34. GET /admin/overview
Write-Host -NoNewline "34. Testing GET /admin/overview... "
$adminOverview = Invoke-RestMethod -Uri "$BaseUrl/admin/overview" -Method Get -Headers $adminHeaders
if ($adminOverview.data.metrics) {
    Write-Host "OK (200 - users: $($adminOverview.data.metrics.totalUsers))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 35. GET /admin/people
Write-Host -NoNewline "35. Testing GET /admin/people... "
$adminPeople = Invoke-RestMethod -Uri "$BaseUrl/admin/people" -Method Get -Headers $adminHeaders
if ($adminPeople.data.Count -gt 0) {
    Write-Host "OK (200 - $($adminPeople.data.Count) people)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 36. GET /admin/markets
Write-Host -NoNewline "36. Testing GET /admin/markets... "
$adminMarkets = Invoke-RestMethod -Uri "$BaseUrl/admin/markets" -Method Get -Headers $adminHeaders
if ($adminMarkets.data.Count -gt 0) {
    Write-Host "OK (200 - $($adminMarkets.data.Count) markets)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 37. GET /admin/moderation
Write-Host -NoNewline "37. Testing GET /admin/moderation... "
$adminMod = Invoke-RestMethod -Uri "$BaseUrl/admin/moderation" -Method Get -Headers $adminHeaders
if ($adminMod.data) {
    Write-Host "OK (200 - $($adminMod.data.Count) flags)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 38. GET /admin/reports/sales.csv
Write-Host -NoNewline "38. Testing GET /admin/reports/sales.csv... "
$adminCsv = Invoke-WebRequest -Uri "$BaseUrl/admin/reports/sales.csv" -Method Get -Headers $adminHeaders
if ($adminCsv.StatusCode -eq 200 -and $adminCsv.Headers['Content-Type'] -match 'text/csv') {
    Write-Host "OK (200 - Content-Type: text/csv)" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

# 39. GET /admin/settings
Write-Host -NoNewline "39. Testing GET /admin/settings... "
$adminSettings = Invoke-RestMethod -Uri "$BaseUrl/admin/settings" -Method Get -Headers $adminHeaders
if ($adminSettings.data) {
    Write-Host "OK (200 - flags: $($adminSettings.data.featureFlags.p2pMessaging))" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red; exit 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🎉  All smoke test steps (1-39) passed successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
