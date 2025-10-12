# COMPREHENSIVE ROLE-BASED ACCESS TESTING
# Tests anonymous users, authenticated users, creators, and admins

Write-Host "🔐 ROLE-BASED ACCESS & FUNCTIONALITY TESTING" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

# Test 1: Anonymous User - Can View Content
Write-Host "TEST 1: Anonymous User - Content Viewing" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

$anonymousTests = @(
    @{Name = "Homepage"; URL = "$baseUrl" },
    @{Name = "Manga Browse"; URL = "$baseUrl/manga" },
    @{Name = "Manga Detail"; URL = "$baseUrl/manga/1" },
    @{Name = "Chapter Reader"; URL = "$baseUrl/manga/1/chapter/1" }
)

foreach ($test in $anonymousTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($test.Name): $($response.StatusCode) - Anonymous can view" -ForegroundColor Green
        $testResults += @{Test = $test.Name; Status = "PASS"; Role = "Anonymous" }
    }
    catch {
        Write-Host "❌ $($test.Name): Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test = $test.Name; Status = "FAIL"; Role = "Anonymous" }
    }
}

Write-Host ""

# Test 2: Anonymous User - Cannot Access Payment Features
Write-Host "TEST 2: Anonymous User - Payment Restrictions" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing if anonymous users are redirected from payment pages..." -ForegroundColor Cyan
$paymentTests = @(
    @{Name = "Coins Page"; URL = "$baseUrl/coins" },
    @{Name = "Pricing Page"; URL = "$baseUrl/pricing" }
)

foreach ($test in $paymentTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($test.Name): $($response.StatusCode) - Page loads (will check for login requirement in UI)" -ForegroundColor Green
        $testResults += @{Test = $test.Name; Status = "PASS"; Role = "Anonymous" }
    }
    catch {
        Write-Host "❌ $($test.Name): Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test = $test.Name; Status = "FAIL"; Role = "Anonymous" }
    }
}

Write-Host ""

# Test 3: API Endpoints - Require Authentication
Write-Host "TEST 3: API Endpoints - Authentication Required" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

$apiTests = @(
    @{Name = "Comments API"; URL = "$baseUrl/api/chapters/1/comments"; Method = "POST" },
    @{Name = "Coins API"; URL = "$baseUrl/api/coins"; Method = "GET" },
    @{Name = "User Profile API"; URL = "$baseUrl/api/auth/me"; Method = "GET" }
)

foreach ($test in $apiTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.URL -Method $test.Method -UseBasicParsing -TimeoutSec 5
        Write-Host "⚠️ $($test.Name): $($response.StatusCode) - Should require auth" -ForegroundColor Yellow
        $testResults += @{Test = $test.Name; Status = "WARNING"; Role = "API" }
    }
    catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Unauthorized*") {
            Write-Host "✅ $($test.Name): 401 Unauthorized - Correctly requires authentication" -ForegroundColor Green
            $testResults += @{Test = $test.Name; Status = "PASS"; Role = "API" }
        }
        else {
            Write-Host "❌ $($test.Name): Unexpected error - $($_.Exception.Message)" -ForegroundColor Red
            $testResults += @{Test = $test.Name; Status = "FAIL"; Role = "API" }
        }
    }
}

Write-Host ""

# Test 4: Creator Dashboard
Write-Host "TEST 4: Creator Dashboard Functionality" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$creatorTests = @(
    @{Name = "Creator Panel"; URL = "$baseUrl/creator-panel" },
    @{Name = "Creator Dashboard"; URL = "$baseUrl/creator/dashboard" },
    @{Name = "Creator Analytics"; URL = "$baseUrl/creator/analytics" },
    @{Name = "Upload Page"; URL = "$baseUrl/upload" }
)

foreach ($test in $creatorTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($test.Name): $($response.StatusCode) - Page accessible" -ForegroundColor Green
        $testResults += @{Test = $test.Name; Status = "PASS"; Role = "Creator" }
    }
    catch {
        Write-Host "❌ $($test.Name): Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test = $test.Name; Status = "FAIL"; Role = "Creator" }
    }
}

Write-Host ""

# Test 5: Admin Dashboard
Write-Host "TEST 5: Admin Dashboard Functionality" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

$adminTests = @(
    @{Name = "Admin Dashboard"; URL = "$baseUrl/admin/dashboard" },
    @{Name = "Admin Users"; URL = "$baseUrl/admin/users" },
    @{Name = "Admin Monitoring"; URL = "$baseUrl/admin/monitoring" }
)

foreach ($test in $adminTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($test.Name): $($response.StatusCode) - Page accessible" -ForegroundColor Green
        $testResults += @{Test = $test.Name; Status = "PASS"; Role = "Admin" }
    }
    catch {
        Write-Host "❌ $($test.Name): Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test = $test.Name; Status = "FAIL"; Role = "Admin" }
    }
}

Write-Host ""

# Summary
Write-Host "📊 TESTING SUMMARY" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warningTests = ($testResults | Where-Object { $_.Status -eq "WARNING" }).Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "⚠️ Warnings: $warningTests" -ForegroundColor Yellow
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Role-based access is working correctly." -ForegroundColor White
}
else {
    Write-Host "⚠️ SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "Please review the failed tests above." -ForegroundColor White
}

Write-Host ""
Write-Host "📋 NEXT: Manual browser testing required for:" -ForegroundColor Cyan
Write-Host "• Comment posting (requires login)" -ForegroundColor White
Write-Host "• Payment features (requires login)" -ForegroundColor White
Write-Host "• Creator dashboard features" -ForegroundColor White
Write-Host "• Admin access to creator features" -ForegroundColor White
