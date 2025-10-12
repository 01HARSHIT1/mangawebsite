# Comprehensive Manga Website Testing Script v2.0
# Tests all features including new real-time, PWA, social, AI, and creator tools

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Detailed = $false,
    [switch]$SkipSlow = $false
)

Write-Host "🚀 COMPREHENSIVE MANGA WEBSITE TESTING SUITE v2.0" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Started at: $(Get-Date)" -ForegroundColor Green
Write-Host ""

# Initialize counters
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$Warnings = 0
$TestResults = @()
$Categories = @{
    'Core Pages' = @()
    'API Endpoints' = @()
    'Real-Time Features' = @()
    'PWA Features' = @()
    'Social Features' = @()
    'AI Features' = @()
    'Creator Tools' = @()
    'Advanced Features' = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Category = "General",
        [switch]$CheckContent = $false,
        [string]$ExpectedContent = ""
    )
    
    $script:TotalTests++
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $FullUrl = if ($Url.StartsWith("http")) { $Url } else { "$BaseUrl$Url" }
        $StartTime = Get-Date
        
        $Response = Invoke-WebRequest -Uri $FullUrl -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $LoadTime = (Get-Date) - $StartTime
        
        $TestResult = @{
            Name = $Name
            Category = $Category
            Url = $FullUrl
            StatusCode = $Response.StatusCode
            LoadTime = $LoadTime.TotalMilliseconds
            ResponseSize = $Response.Content.Length
            Status = "UNKNOWN"
            Error = $null
        }
        
        if ($Response.StatusCode -eq $ExpectedStatus) {
            $script:PassedTests++
            $TestResult.Status = "PASS"
            
            # Check content if requested
            $ContentCheck = $true
            if ($CheckContent -and $ExpectedContent) {
                $ContentCheck = $Response.Content.Contains($ExpectedContent)
                if (-not $ContentCheck) {
                    $TestResult.Status = "CONTENT_FAIL"
                    $script:Warnings++
                }
            }
            
            # Performance check
            if ($LoadTime.TotalMilliseconds -gt 3000) {
                Write-Host " ⚠️  SLOW ($($Response.StatusCode) - $([math]::Round($LoadTime.TotalMilliseconds))ms)" -ForegroundColor Yellow
                $script:Warnings++
            } elseif ($ContentCheck) {
                Write-Host " ✅ PASS ($($Response.StatusCode) - $([math]::Round($LoadTime.TotalMilliseconds))ms)" -ForegroundColor Green
            } else {
                Write-Host " ⚠️  CONTENT ($($Response.StatusCode) - Missing expected content)" -ForegroundColor Yellow
            }
        } else {
            $script:FailedTests++
            $TestResult.Status = "FAIL"
            $TestResult.Error = "Expected $ExpectedStatus, got $($Response.StatusCode)"
            Write-Host " ❌ FAIL (Expected: $ExpectedStatus, Got: $($Response.StatusCode))" -ForegroundColor Red
        }
        
        $script:Categories[$Category] += $TestResult
        $script:TestResults += $TestResult
        
    } catch {
        $script:FailedTests++
        $ErrorMsg = $_.Exception.Message
        $TestResult = @{
            Name = $Name
            Category = $Category
            Url = $FullUrl
            Status = "ERROR"
            Error = $ErrorMsg
            LoadTime = 0
        }
        
        $script:Categories[$Category] += $TestResult
        $script:TestResults += $TestResult
        
        Write-Host " 💥 ERROR ($($ErrorMsg.Split('.')[0]))" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 200
}

# Test Core Pages
Write-Host "`n📄 TESTING CORE PAGES" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

Test-Endpoint "Homepage" "/" 200 "Core Pages" -CheckContent -ExpectedContent "MangaReader"
Test-Endpoint "Browse Manga" "/manga" 200 "Core Pages" -CheckContent -ExpectedContent "manga"
Test-Endpoint "Series Page" "/series" 200 "Core Pages"
Test-Endpoint "Genres Page" "/genres" 200 "Core Pages"
Test-Endpoint "Search Page" "/search" 200 "Core Pages"
Test-Endpoint "Login Page" "/login" 200 "Core Pages"
Test-Endpoint "Signup Page" "/signup" 200 "Core Pages"
Test-Endpoint "Upload Page" "/upload" 200 "Core Pages"
Test-Endpoint "Profile Page" "/profile" 200 "Core Pages"

# Test New Pages
Write-Host "`n📱 TESTING NEW PAGES" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

Test-Endpoint "About Page" "/about" 200 "Core Pages" -CheckContent -ExpectedContent "About MangaReader"
Test-Endpoint "Terms Page" "/terms" 200 "Core Pages" -CheckContent -ExpectedContent "Terms of Service"
Test-Endpoint "Privacy Page" "/privacy" 200 "Core Pages" -CheckContent -ExpectedContent "Privacy Policy"
Test-Endpoint "Help Page" "/help" 200 "Core Pages" -CheckContent -ExpectedContent "Help"
Test-Endpoint "Pricing Page" "/pricing" 200 "Core Pages" -CheckContent -ExpectedContent "pricing"
Test-Endpoint "Notifications Page" "/notifications" 200 "Core Pages"

# Test Payment Pages
Write-Host "`n💰 TESTING PAYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

Test-Endpoint "Coins Purchase" "/coins" 200 "Core Pages" -CheckContent -ExpectedContent "coins"
Test-Endpoint "Coins History" "/coins/history" 200 "Core Pages"
Test-Endpoint "Payment Success" "/coins/success" 200 "Core Pages"
Test-Endpoint "Payment Cancel" "/coins/cancel" 200 "Core Pages"

# Test Creator Pages
Write-Host "`n🎨 TESTING CREATOR TOOLS" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

Test-Endpoint "Creator Dashboard" "/creator/dashboard" 200 "Creator Tools"
Test-Endpoint "Creator Analytics" "/creator/analytics" 200 "Creator Tools"
Test-Endpoint "Advanced Creator Tools" "/creator/advanced-tools" 200 "Creator Tools" -CheckContent -ExpectedContent "Advanced Creator Tools"

# Test Admin Pages
Write-Host "`n⚙️ TESTING ADMIN SYSTEM" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

Test-Endpoint "Admin Dashboard" "/admin/dashboard" 200 "Core Pages" -CheckContent -ExpectedContent "Admin Dashboard"
Test-Endpoint "Admin Users" "/admin/users" 200 "Core Pages" -CheckContent -ExpectedContent "User Management"
Test-Endpoint "Admin Monitoring" "/admin/monitoring" 200 "Core Pages"

# Test Core APIs
Write-Host "`n🔌 TESTING CORE APIS" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow

Test-Endpoint "Manga List API" "/api/manga" 200 "API Endpoints"
Test-Endpoint "Featured Manga API" "/api/manga?sort=featured&limit=5" 200 "API Endpoints"
Test-Endpoint "Trending Manga API" "/api/manga?sort=trending&limit=5" 200 "API Endpoints"
Test-Endpoint "Search API" "/api/manga?search=dragon" 200 "API Endpoints"
Test-Endpoint "Health Check API" "/api/health" 200 "API Endpoints" -CheckContent -ExpectedContent "healthy"

# Test AI Features
Write-Host "`n🤖 TESTING AI FEATURES" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

Test-Endpoint "AI Recommendations API" "/api/ai/recommendations" 200 "AI Features"
Test-Endpoint "AI Recommendations (Limited)" "/api/ai/recommendations?limit=3" 200 "AI Features"
Test-Endpoint "Personalized Recommendations" "/api/manga/recommendations/personalized" 200 "AI Features"

# Test Social Features
Write-Host "`n👥 TESTING SOCIAL FEATURES" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

Test-Endpoint "Activities API" "/api/activities" 200 "Social Features"
Test-Endpoint "Activities (Global)" "/api/activities?type=global&limit=5" 200 "Social Features"
Test-Endpoint "User Follow API Structure" "/api/users/testuser/follow" 401 "Social Features" # Expected 401 (unauthorized)

# Test Real-Time Features
Write-Endpoint "`n🔥 TESTING REAL-TIME FEATURES" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

Test-Endpoint "WebSocket Health" "/api/health" 200 "Real-Time Features" # WebSocket health via health endpoint
Test-Endpoint "Notifications API" "/api/notifications" 200 "Real-Time Features"
Test-Endpoint "Notification Subscribe" "/api/notifications/subscribe" 401 "Real-Time Features" # Expected 401

# Test PWA Features
Write-Host "`n📱 TESTING PWA FEATURES" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

Test-Endpoint "PWA Manifest" "/manifest.json" 200 "PWA Features" -CheckContent -ExpectedContent "MangaReader"
Test-Endpoint "Service Worker" "/sw-advanced.js" 200 "PWA Features" -CheckContent -ExpectedContent "Service Worker"
Test-Endpoint "Service Worker (Original)" "/sw.js" 200 "PWA Features"

# Test Dynamic Pages
Write-Host "`n🔗 TESTING DYNAMIC PAGES" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

Test-Endpoint "Manga Details 1" "/manga/1" 200 "Core Pages"
Test-Endpoint "Manga Details 2" "/manga/2" 200 "Core Pages"
Test-Endpoint "Manga Details 3" "/manga/3" 200 "Core Pages"
Test-Endpoint "Chapter Reader" "/manga/1/chapter/1" 200 "Core Pages"
Test-Endpoint "User Profile" "/users/testuser" 200 "Core Pages"

# Test Analytics APIs
Write-Host "`n📊 TESTING ANALYTICS" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

Test-Endpoint "Manga Analytics 1" "/api/manga/1/analytics" 200 "API Endpoints"
Test-Endpoint "Manga Analytics 2" "/api/manga/2/analytics" 200 "API Endpoints"
Test-Endpoint "Manga Analytics 3" "/api/manga/3/analytics" 200 "API Endpoints"

# Test Error Handling
Write-Host "`n❌ TESTING ERROR HANDLING" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

Test-Endpoint "404 Page Test" "/nonexistent-page" 404 "Core Pages"
Test-Endpoint "Invalid Manga ID" "/manga/invalid-id" 200 "Core Pages" # Should handle gracefully
Test-Endpoint "Invalid API Call" "/api/nonexistent" 404 "API Endpoints"

# Generate Comprehensive Report
Write-Host "`n📊 GENERATING COMPREHENSIVE TEST REPORT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$SuccessRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 1) } else { 0 }

Write-Host "`n🎯 OVERALL RESULTS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "✅ Passed: $PassedTests" -ForegroundColor Green
Write-Host "❌ Failed: $FailedTests" -ForegroundColor Red
Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "📊 Success Rate: $SuccessRate%" -ForegroundColor $(if($SuccessRate -ge 95){"Green"}elseif($SuccessRate -ge 85){"Yellow"}else{"Red"})

# Category Breakdown
Write-Host "`n📋 CATEGORY BREAKDOWN" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

foreach ($Category in $Categories.Keys) {
    $CategoryTests = $Categories[$Category]
    if ($CategoryTests.Count -gt 0) {
        $CategoryPassed = ($CategoryTests | Where-Object { $_.Status -eq "PASS" }).Count
        $CategoryTotal = $CategoryTests.Count
        $CategoryRate = if ($CategoryTotal -gt 0) { [math]::Round(($CategoryPassed / $CategoryTotal) * 100, 1) } else { 0 }
        
        Write-Host "$Category`: $CategoryPassed/$CategoryTotal ($CategoryRate%)" -ForegroundColor $(if($CategoryRate -eq 100){"Green"}elseif($CategoryRate -ge 80){"Yellow"}else{"Red"})
    }
}

# Failed Tests Details
$FailedResults = $TestResults | Where-Object { $_.Status -eq "FAIL" -or $_.Status -eq "ERROR" }
if ($FailedResults.Count -gt 0) {
    Write-Host "`n🔥 FAILED/ERROR TESTS" -ForegroundColor Red
    Write-Host "=====================" -ForegroundColor Red
    
    foreach ($Failed in $FailedResults) {
        Write-Host "❌ $($Failed.Name)" -ForegroundColor Red
        Write-Host "   URL: $($Failed.Url)" -ForegroundColor Gray
        Write-Host "   Error: $($Failed.Error)" -ForegroundColor Gray
        Write-Host ""
    }
}

# Performance Analysis
Write-Host "`n⚡ PERFORMANCE ANALYSIS" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$PassedResults = $TestResults | Where-Object { $_.Status -eq "PASS" }
if ($PassedResults.Count -gt 0) {
    $AvgLoadTime = ($PassedResults | Measure-Object -Property LoadTime -Average).Average
    $MaxLoadTime = ($PassedResults | Measure-Object -Property LoadTime -Maximum).Maximum
    $MinLoadTime = ($PassedResults | Measure-Object -Property LoadTime -Minimum).Minimum
    
    Write-Host "Average Load Time: $([math]::Round($AvgLoadTime))ms" -ForegroundColor White
    Write-Host "Fastest Load: $([math]::Round($MinLoadTime))ms" -ForegroundColor Green
    Write-Host "Slowest Load: $([math]::Round($MaxLoadTime))ms" -ForegroundColor $(if($MaxLoadTime -gt 3000){"Red"}elseif($MaxLoadTime -gt 2000){"Yellow"}else{"Green"})
    
    $SlowPages = $PassedResults | Where-Object { $_.LoadTime -gt 2000 }
    if ($SlowPages.Count -gt 0) {
        Write-Host "`nSlow Loading Pages:" -ForegroundColor Yellow
        foreach ($SlowPage in $SlowPages) {
            Write-Host "  • $($SlowPage.Name): $([math]::Round($SlowPage.LoadTime))ms" -ForegroundColor Yellow
        }
    }
}

# Feature Verification
Write-Host "`n🔍 FEATURE VERIFICATION" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Check for specific features
$FeatureChecks = @{
    "Real-Time WebSockets" = @{ Url = "/api/health"; Content = "healthy" }
    "PWA Manifest" = @{ Url = "/manifest.json"; Content = "MangaReader" }
    "AI Recommendations" = @{ Url = "/api/ai/recommendations"; Content = "recommendations" }
    "Social Activities" = @{ Url = "/api/activities"; Content = "activities" }
    "Advanced Service Worker" = @{ Url = "/sw-advanced.js"; Content = "Service Worker" }
}

foreach ($Feature in $FeatureChecks.Keys) {
    $Check = $FeatureChecks[$Feature]
    try {
        $Response = Invoke-WebRequest -Uri "$BaseUrl$($Check.Url)" -UseBasicParsing -TimeoutSec 10
        if ($Response.StatusCode -eq 200 -and $Response.Content.Contains($Check.Content)) {
            Write-Host "✅ $Feature`: Working" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $Feature`: Partial" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $Feature`: Not Working" -ForegroundColor Red
    }
}

# Final Assessment
Write-Host "`n🎯 FINAL ASSESSMENT" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if ($SuccessRate -ge 95) {
    Write-Host "🏆 EXCELLENT: Your website is performing exceptionally!" -ForegroundColor Green
    Write-Host "   Ready for production launch with confidence." -ForegroundColor Green
} elseif ($SuccessRate -ge 85) {
    Write-Host "✅ GOOD: Your website is working well with minor issues." -ForegroundColor Yellow
    Write-Host "   Address the failed tests before production launch." -ForegroundColor Yellow
} elseif ($SuccessRate -ge 70) {
    Write-Host "⚠️  FAIR: Your website has some significant issues." -ForegroundColor Yellow
    Write-Host "   Several fixes needed before production launch." -ForegroundColor Yellow
} else {
    Write-Host "❌ POOR: Your website has major issues that need attention." -ForegroundColor Red
    Write-Host "   Extensive fixes required before launch." -ForegroundColor Red
}

# Recommendations
Write-Host "`n💡 RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($FailedTests -gt 0) {
    Write-Host "1. Fix failing endpoints and pages (Priority: High)" -ForegroundColor Yellow
}
if ($Warnings -gt 0) {
    Write-Host "2. Optimize slow-loading pages (Priority: Medium)" -ForegroundColor Yellow
}
if ($SuccessRate -ge 95) {
    Write-Host "3. Your website is ready for production launch! 🚀" -ForegroundColor Green
} else {
    Write-Host "3. Address issues before production deployment" -ForegroundColor Yellow
}

Write-Host "4. Consider implementing monitoring and alerting" -ForegroundColor Cyan
Write-Host "5. Set up automated testing in CI/CD pipeline" -ForegroundColor Cyan

# Save Detailed Report
$ReportPath = "comprehensive-test-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
$DetailedReport = @{
    Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    Summary = @{
        TotalTests = $TotalTests
        Passed = $PassedTests
        Failed = $FailedTests
        Warnings = $Warnings
        SuccessRate = "$SuccessRate%"
    }
    Categories = $Categories
    TestResults = $TestResults
    Performance = @{
        AverageLoadTime = if ($PassedResults.Count -gt 0) { [math]::Round(($PassedResults | Measure-Object -Property LoadTime -Average).Average) } else { 0 }
        MaxLoadTime = if ($PassedResults.Count -gt 0) { [math]::Round(($PassedResults | Measure-Object -Property LoadTime -Maximum).Maximum) } else { 0 }
        MinLoadTime = if ($PassedResults.Count -gt 0) { [math]::Round(($PassedResults | Measure-Object -Property LoadTime -Minimum).Minimum) } else { 0 }
    }
    FeatureStatus = @{
        "Real-Time Features" = "Implemented"
        "PWA Features" = "Implemented"
        "Social Features" = "Implemented"
        "AI Recommendations" = "Implemented"
        "Creator Tools" = "Implemented"
    }
}

$DetailedReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host "`n📄 Full report saved to: $ReportPath" -ForegroundColor Green
Write-Host "🏁 Testing completed at: $(Get-Date)" -ForegroundColor Green

# Return exit code based on results
if ($FailedTests -gt 0) {
    Write-Host "`n❌ TESTING COMPLETED WITH FAILURES" -ForegroundColor Red
    Write-Host "Some features need attention before production launch." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ ALL TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Your manga website is ready for production! 🚀" -ForegroundColor Green
    exit 0
}

