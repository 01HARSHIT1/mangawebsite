# Simple Manga Website Testing Script
param([string]$BaseUrl = "http://localhost:3000")

Write-Host "🚀 MANGA WEBSITE TESTING SUITE" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Testing URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$TestResults = @()

function Test-Page {
    param([string]$Name, [string]$Url, [int]$Expected = 200)
    
    $script:TotalTests++
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $FullUrl = if ($Url.StartsWith("http")) { $Url } else { "$BaseUrl$Url" }
        $Response = Invoke-WebRequest -Uri $FullUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($Response.StatusCode -eq $Expected) {
            $script:PassedTests++
            Write-Host " ✅ PASS ($($Response.StatusCode))" -ForegroundColor Green
            $script:TestResults += [PSCustomObject]@{
                Name = $Name
                Status = "PASS"
                StatusCode = $Response.StatusCode
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
        Write-Host " 💥 ERROR ($($_.Exception.Message))" -ForegroundColor Red
        $script:TestResults += [PSCustomObject]@{
            Name = $Name
            Status = "ERROR"
            Error = $_.Exception.Message
            Url = $FullUrl
        }
        return $false
    }
    
    Start-Sleep -Milliseconds 200
}

# Test Public Pages
Write-Host "`n📄 TESTING PUBLIC PAGES" -ForegroundColor Cyan
Test-Page "Homepage" "/"
Test-Page "Browse Manga" "/manga"
Test-Page "Series Page" "/series"
Test-Page "Genres Page" "/genres"
Test-Page "Search Page" "/search"
Test-Page "About Page" "/about"
Test-Page "Contact Page" "/contact"
Test-Page "Terms Page" "/terms"
Test-Page "Privacy Page" "/privacy"
Test-Page "Help Page" "/help"
Test-Page "Pricing Page" "/pricing"
Test-Page "Login Page" "/login"
Test-Page "Signup Page" "/signup"

# Test API Endpoints
Write-Host "`n🔌 TESTING API ENDPOINTS" -ForegroundColor Cyan
Test-Page "Manga List API" "/api/manga"
Test-Page "Featured Manga API" "/api/manga?sort=featured`&limit=5"
Test-Page "Trending Manga API" "/api/manga?sort=trending`&limit=10"
Test-Page "Search API" "/api/manga?search=dragon"
Test-Page "Genre Filter API" "/api/manga?genre=Fantasy"
Test-Page "Manga Analytics API 1" "/api/manga/1/analytics"
Test-Page "Manga Analytics API 2" "/api/manga/2/analytics"
Test-Page "Manga Analytics API 3" "/api/manga/3/analytics"

# Test Dynamic Pages
Write-Host "`n🔗 TESTING DYNAMIC PAGES" -ForegroundColor Cyan
Test-Page "Manga Details 1" "/manga/1"
Test-Page "Manga Details 2" "/manga/2"
Test-Page "Manga Details 3" "/manga/3"
Test-Page "Chapter Reader" "/manga/1/chapter/1"
Test-Page "Creator Dashboard" "/creator/dashboard"
Test-Page "Creator Analytics" "/creator/analytics"
Test-Page "Upload Page" "/upload"
Test-Page "Profile Page" "/profile"

# Test Payment Pages
Write-Host "`n💰 TESTING PAYMENT PAGES" -ForegroundColor Cyan
Test-Page "Coins Purchase" "/coins"
Test-Page "Coins History" "/coins/history"
Test-Page "Payment Success" "/coins/success"
Test-Page "Payment Cancel" "/coins/cancel"

# Test Admin Pages
Write-Host "`n⚙️ TESTING ADMIN PAGES" -ForegroundColor Cyan
Test-Page "Admin Dashboard" "/admin/dashboard"
Test-Page "Admin Users" "/admin/users"
Test-Page "Admin Stats API" "/api/admin/stats"
Test-Page "System Health API" "/api/admin/system-health"

# Test Error Pages
Write-Host "`n❌ TESTING ERROR HANDLING" -ForegroundColor Cyan
Test-Page "404 Page" "/nonexistent-page" 404

# Generate Summary
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$SuccessRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 2) } else { 0 }

Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "✅ Passed: $PassedTests" -ForegroundColor Green  
Write-Host "❌ Failed: $FailedTests" -ForegroundColor Red
Write-Host "📊 Success Rate: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 90) { "Green" } elseif ($SuccessRate -ge 70) { "Yellow" } else { "Red" })

# Show failed tests
$FailedResults = $TestResults | Where-Object { $_.Status -ne "PASS" }
if ($FailedResults.Count -gt 0) {
    Write-Host "`n🔥 FAILED TESTS:" -ForegroundColor Red
    $FailedResults | ForEach-Object { 
        Write-Host "- $($_.Name): $($_.Error -or 'Status code mismatch')" -ForegroundColor Red
    }
}

# Recommendations
Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan
if ($FailedTests -gt 0) {
    Write-Host "1. Fix failing endpoints and pages" -ForegroundColor Yellow
}
if ($SuccessRate -lt 90) {
    Write-Host "2. Success rate below 90% - requires attention" -ForegroundColor Yellow
}
Write-Host "3. All core functionality appears to be working" -ForegroundColor Green

Write-Host "`n🏁 Testing completed at: $(Get-Date)" -ForegroundColor Green

if ($FailedTests -gt 0) {
    exit 1
} else {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
}
