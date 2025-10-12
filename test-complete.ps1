# Complete Manga Website Testing Script
param([string]$BaseUrl = "http://localhost:3000")

Write-Host "🚀 COMPREHENSIVE MANGA WEBSITE TESTING" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Testing URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$TestResults = @()

function Test-Page {
    param([string]$Name, [string]$Url, [int]$Expected = 200, [string]$Category = "General")
    
    $script:TotalTests++
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $FullUrl = if ($Url.StartsWith("http")) { $Url } else { "$BaseUrl$Url" }
        $StartTime = Get-Date
        $Response = Invoke-WebRequest -Uri $FullUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $LoadTime = (Get-Date) - $StartTime
        
        if ($Response.StatusCode -eq $Expected) {
            $script:PassedTests++
            $LoadTimeMs = [math]::Round($LoadTime.TotalMilliseconds)
            Write-Host " ✅ PASS ($($Response.StatusCode) - $($LoadTimeMs)ms)" -ForegroundColor Green
            
            $script:TestResults += [PSCustomObject]@{
                Name = $Name
                Category = $Category
                Status = "PASS"
                StatusCode = $Response.StatusCode
                LoadTime = $LoadTimeMs
                Url = $FullUrl
            }
            return $true
        } else {
            $script:FailedTests++
            Write-Host " ❌ FAIL (Expected: $Expected, Got: $($Response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        $script:FailedTests++
        Write-Host " 💥 ERROR ($($_.Exception.Message.Split('.')[0]))" -ForegroundColor Red
        $script:TestResults += [PSCustomObject]@{
            Name = $Name
            Category = $Category
            Status = "ERROR"
            Error = $_.Exception.Message.Split('.')[0]
            Url = $FullUrl
        }
        return $false
    }
}

# Test Core Pages
Write-Host "`n📄 TESTING CORE PAGES" -ForegroundColor Yellow
Test-Page "Homepage" "/" 200 "Core Pages"
Test-Page "Browse Manga" "/manga" 200 "Core Pages"
Test-Page "Series Page" "/series" 200 "Core Pages"
Test-Page "Genres Page" "/genres" 200 "Core Pages"
Test-Page "Search Page" "/search" 200 "Core Pages"
Test-Page "About Page" "/about" 200 "Core Pages"
Test-Page "Terms Page" "/terms" 200 "Core Pages"
Test-Page "Privacy Page" "/privacy" 200 "Core Pages"
Test-Page "Help Page" "/help" 200 "Core Pages"
Test-Page "Pricing Page" "/pricing" 200 "Core Pages"
Test-Page "Contact Page" "/contact" 200 "Core Pages"
Test-Page "Login Page" "/login" 200 "Core Pages"
Test-Page "Signup Page" "/signup" 200 "Core Pages"
Test-Page "Upload Page" "/upload" 200 "Core Pages"
Test-Page "Profile Page" "/profile" 200 "Core Pages"

# Test New Advanced Pages
Write-Host "`n🚀 TESTING ADVANCED PAGES" -ForegroundColor Yellow
Test-Page "Notifications" "/notifications" 200 "Advanced Features"
Test-Page "Advanced Creator Tools" "/creator/advanced-tools" 200 "Creator Tools"
Test-Page "Creator Dashboard" "/creator/dashboard" 200 "Creator Tools"
Test-Page "Creator Analytics" "/creator/analytics" 200 "Creator Tools"

# Test Payment System
Write-Host "`n💰 TESTING PAYMENT SYSTEM" -ForegroundColor Yellow
Test-Page "Coins Purchase" "/coins" 200 "Payment System"
Test-Page "Coins History" "/coins/history" 200 "Payment System"
Test-Page "Payment Success" "/coins/success" 200 "Payment System"
Test-Page "Payment Cancel" "/coins/cancel" 200 "Payment System"

# Test Admin System
Write-Host "`n⚙️ TESTING ADMIN SYSTEM" -ForegroundColor Yellow
Test-Page "Admin Dashboard" "/admin/dashboard" 200 "Admin System"
Test-Page "Admin Users" "/admin/users" 200 "Admin System"
Test-Page "Admin Monitoring" "/admin/monitoring" 200 "Admin System"

# Test Core APIs
Write-Host "`n🔌 TESTING CORE APIS" -ForegroundColor Yellow
Test-Page "Manga List API" "/api/manga" 200 "API Endpoints"
Test-Page "Health Check API" "/api/health" 200 "API Endpoints"
Test-Page "Featured Manga API" "/api/manga?sort=featured" 200 "API Endpoints"

# Test AI Features
Write-Host "`n🤖 TESTING AI FEATURES" -ForegroundColor Yellow
Test-Page "AI Recommendations API" "/api/ai/recommendations" 200 "AI Features"
Test-Page "Personalized Recommendations" "/api/manga/recommendations/personalized" 200 "AI Features"

# Test Social Features
Write-Host "`n👥 TESTING SOCIAL FEATURES" -ForegroundColor Yellow
Test-Page "Activities API" "/api/activities" 200 "Social Features"
Test-Page "Notifications API" "/api/notifications" 200 "Social Features"

# Test PWA Features
Write-Host "`n📱 TESTING PWA FEATURES" -ForegroundColor Yellow
Test-Page "PWA Manifest" "/manifest.json" 200 "PWA Features"
Test-Page "Advanced Service Worker" "/sw-advanced.js" 200 "PWA Features"
Test-Page "Original Service Worker" "/sw.js" 200 "PWA Features"

# Test Dynamic Pages
Write-Host "`n🔗 TESTING DYNAMIC PAGES" -ForegroundColor Yellow
Test-Page "Manga Details 1" "/manga/1" 200 "Dynamic Pages"
Test-Page "Manga Details 2" "/manga/2" 200 "Dynamic Pages"
Test-Page "Manga Details 3" "/manga/3" 200 "Dynamic Pages"
Test-Page "Chapter Reader" "/manga/1/chapter/1" 200 "Dynamic Pages"

# Test Analytics
Write-Host "`n📊 TESTING ANALYTICS" -ForegroundColor Yellow
Test-Page "Manga Analytics 1" "/api/manga/1/analytics" 200 "Analytics"
Test-Page "Manga Analytics 2" "/api/manga/2/analytics" 200 "Analytics"
Test-Page "Manga Analytics 3" "/api/manga/3/analytics" 200 "Analytics"

# Test Error Handling
Write-Host "`n❌ TESTING ERROR HANDLING" -ForegroundColor Yellow
Test-Page "404 Test" "/nonexistent-page" 404 "Error Handling"

# Generate Final Report
$SuccessRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 1) } else { 0 }

Write-Host "`n📊 FINAL TEST RESULTS" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "✅ Passed: $PassedTests" -ForegroundColor Green
Write-Host "❌ Failed: $FailedTests" -ForegroundColor Red
Write-Host "📊 Success Rate: $SuccessRate%" -ForegroundColor $(if($SuccessRate -ge 95){"Green"}elseif($SuccessRate -ge 85){"Yellow"}else{"Red"})

# Show failed tests
$FailedResults = $TestResults | Where-Object { $_.Status -ne "PASS" }
if ($FailedResults.Count -gt 0) {
    Write-Host "`n🔥 ISSUES FOUND:" -ForegroundColor Red
    $FailedResults | ForEach-Object { 
        Write-Host "- $($_.Name): $($_.Error -or 'Status code mismatch')" -ForegroundColor Red
    }
} else {
    Write-Host "`n🎉 NO ISSUES FOUND!" -ForegroundColor Green
}

# Final Status
Write-Host "`n🎯 FINAL STATUS" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($SuccessRate -ge 95) {
    Write-Host "🏆 EXCELLENT - Ready for production launch!" -ForegroundColor Green
} elseif ($SuccessRate -ge 85) {
    Write-Host "✅ GOOD - Minor fixes needed" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  NEEDS ATTENTION - Several issues to fix" -ForegroundColor Red
}

Write-Host "`n🏁 Testing completed at: $(Get-Date)" -ForegroundColor Green

if ($FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}

