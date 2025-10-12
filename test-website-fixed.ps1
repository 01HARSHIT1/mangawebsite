# COMPREHENSIVE WEBSITE TESTING SCRIPT
# Tests the complete user journey and identifies runtime errors

param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"
$TestResults = @()
$Errors = @()

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message,
        [string]$Error = ""
    )
    
    $result = @{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Error = $Error
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $TestResults += $result
    
    if ($Status -eq "PASS") {
        Write-Host "✅ $TestName : $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName : $Message" -ForegroundColor Red
        if ($Error) {
            Write-Host "   Error: $Error" -ForegroundColor Yellow
        }
    }
}

function Test-WebPage {
    param(
        [string]$Url,
        [string]$TestName,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        Write-Host "`n🔍 Testing: $TestName" -ForegroundColor Cyan
        Write-Host "URL: $Url" -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-TestResult -TestName $TestName -Status "PASS" -Message "Page loaded successfully (Status: $($response.StatusCode))"
            return $true
        } else {
            Write-TestResult -TestName $TestName -Status "FAIL" -Message "Page returned status code: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-TestResult -TestName $TestName -Status "FAIL" -Message "Failed to load page" -Error $_.Exception.Message
        $Errors += @{
            Type = "HTTP Error"
            Test = $TestName
            URL = $Url
            Message = $_.Exception.Message
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        return $false
    }
}

function Test-APIEndpoint {
    param(
        [string]$Url,
        [string]$TestName,
        [string]$Method = "GET"
    )
    
    try {
        Write-Host "`n🔍 Testing API: $TestName" -ForegroundColor Cyan
        Write-Host "URL: $Url" -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-TestResult -TestName $TestName -Status "PASS" -Message "API endpoint responded successfully"
            return $true
        } else {
            Write-TestResult -TestName $TestName -Status "FAIL" -Message "API returned status code: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-TestResult -TestName $TestName -Status "FAIL" -Message "API endpoint failed" -Error $_.Exception.Message
        $Errors += @{
            Type = "API Error"
            Test = $TestName
            URL = $Url
            Message = $_.Exception.Message
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        return $false
    }
}

# Main Testing Function
function Start-WebsiteTesting {
    Write-Host "🚀 STARTING COMPREHENSIVE WEBSITE TESTING" -ForegroundColor Magenta
    Write-Host "=========================================" -ForegroundColor Magenta
    Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
    Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
    
    # PHASE 1: ANONYMOUS USER TESTING
    Write-Host "`n🔍 PHASE 1: ANONYMOUS USER TESTING" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl" -TestName "1.1 - Homepage"
    Test-WebPage -Url "$BaseUrl/manga" -TestName "1.2 - Manga Browse Page"
    Test-WebPage -Url "$BaseUrl/genres" -TestName "1.3 - Genres Page"
    Test-WebPage -Url "$BaseUrl/search" -TestName "1.4 - Search Page"
    Test-WebPage -Url "$BaseUrl/series" -TestName "1.5 - Series Page"
    
    # PHASE 2: AUTHENTICATION PAGES
    Write-Host "`n🔐 PHASE 2: AUTHENTICATION PAGES" -ForegroundColor Yellow
    Write-Host "===================================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/login" -TestName "2.1 - Login Page"
    Test-WebPage -Url "$BaseUrl/signup" -TestName "2.2 - Signup Page"
    
    # PHASE 3: AUTHENTICATED USER PAGES
    Write-Host "`n👤 PHASE 3: AUTHENTICATED USER PAGES" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/profile" -TestName "3.1 - User Profile"
    Test-WebPage -Url "$BaseUrl/library" -TestName "3.2 - User Library"
    Test-WebPage -Url "$BaseUrl/stats" -TestName "3.3 - Reading Stats"
    Test-WebPage -Url "$BaseUrl/notifications" -TestName "3.4 - Notifications"
    
    # PHASE 4: CREATOR PAGES
    Write-Host "`n🎨 PHASE 4: CREATOR PAGES" -ForegroundColor Yellow
    Write-Host "===========================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/creator-panel" -TestName "4.1 - Creator Panel"
    Test-WebPage -Url "$BaseUrl/creator/dashboard" -TestName "4.2 - Creator Dashboard"
    Test-WebPage -Url "$BaseUrl/creator/analytics" -TestName "4.3 - Creator Analytics"
    Test-WebPage -Url "$BaseUrl/creator/advanced-tools" -TestName "4.4 - Advanced Tools"
    Test-WebPage -Url "$BaseUrl/upload" -TestName "4.5 - Upload Page"
    
    # PHASE 5: ADMIN PAGES
    Write-Host "`n👑 PHASE 5: ADMIN PAGES" -ForegroundColor Yellow
    Write-Host "========================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/admin/dashboard" -TestName "5.1 - Admin Dashboard"
    Test-WebPage -Url "$BaseUrl/admin/users" -TestName "5.2 - Admin Users"
    Test-WebPage -Url "$BaseUrl/admin/monitoring" -TestName "5.3 - Admin Monitoring"
    Test-WebPage -Url "$BaseUrl/admin-dashboard" -TestName "5.4 - Admin Dashboard Alt"
    
    # PHASE 6: MONETIZATION PAGES
    Write-Host "`n💰 PHASE 6: MONETIZATION PAGES" -ForegroundColor Yellow
    Write-Host "===============================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/coins" -TestName "6.1 - Coins Page"
    Test-WebPage -Url "$BaseUrl/coins/history" -TestName "6.2 - Coin History"
    Test-WebPage -Url "$BaseUrl/coins/success" -TestName "6.3 - Payment Success"
    Test-WebPage -Url "$BaseUrl/coins/cancel" -TestName "6.4 - Payment Cancel"
    Test-WebPage -Url "$BaseUrl/pricing" -TestName "6.5 - Pricing Page"
    
    # PHASE 7: UTILITY PAGES
    Write-Host "`nℹ️ PHASE 7: UTILITY PAGES" -ForegroundColor Yellow
    Write-Host "=========================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/about" -TestName "7.1 - About Page"
    Test-WebPage -Url "$BaseUrl/contact" -TestName "7.2 - Contact Page"
    Test-WebPage -Url "$BaseUrl/help" -TestName "7.3 - Help Page"
    Test-WebPage -Url "$BaseUrl/terms" -TestName "7.4 - Terms Page"
    Test-WebPage -Url "$BaseUrl/privacy" -TestName "7.5 - Privacy Page"
    
    # PHASE 8: API ENDPOINTS TESTING
    Write-Host "`n🔌 PHASE 8: API ENDPOINTS TESTING" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Yellow
    
    Test-APIEndpoint -Url "$BaseUrl/api/manga" -TestName "8.1 - Manga API"
    Test-APIEndpoint -Url "$BaseUrl/api/health" -TestName "8.2 - Health Check API"
    Test-APIEndpoint -Url "$BaseUrl/api/notifications" -TestName "8.3 - Notifications API"
    Test-APIEndpoint -Url "$BaseUrl/api/activities" -TestName "8.4 - Activities API"
    Test-APIEndpoint -Url "$BaseUrl/api/ai/recommendations" -TestName "8.5 - AI Recommendations API"
    
    # PHASE 9: DYNAMIC ROUTES TESTING
    Write-Host "`n📚 PHASE 9: DYNAMIC ROUTES TESTING" -ForegroundColor Yellow
    Write-Host "====================================" -ForegroundColor Yellow
    
    Test-WebPage -Url "$BaseUrl/manga/1" -TestName "9.1 - Manga Detail (ID: 1)"
    Test-WebPage -Url "$BaseUrl/manga/1/chapter/1" -TestName "9.2 - Chapter Reader (ID: 1/1)"
    Test-WebPage -Url "$BaseUrl/users/1" -TestName "9.3 - User Profile (ID: 1)"
    
    # Generate Report
    Generate-TestReport
}

function Generate-TestReport {
    Write-Host "`n📊 GENERATING COMPREHENSIVE TEST REPORT" -ForegroundColor Magenta
    Write-Host "=======================================" -ForegroundColor Magenta
    
    $totalTests = $TestResults.Count
    $passedTests = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failedTests = ($TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $totalErrors = $Errors.Count
    
    Write-Host "`n📈 TEST SUMMARY:" -ForegroundColor Cyan
    Write-Host "Total Tests: $totalTests" -ForegroundColor White
    Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
    Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
    Write-Host "🐛 Errors: $totalErrors" -ForegroundColor Yellow
    
    # Error Categories
    $errorCategories = $Errors | Group-Object Type | ForEach-Object { @{ Type = $_.Name; Count = $_.Count } }
    if ($errorCategories.Count -gt 0) {
        Write-Host "`n🐛 ERROR CATEGORIES:" -ForegroundColor Yellow
        $errorCategories | ForEach-Object { Write-Host "$($_.Type): $($_.Count) errors" -ForegroundColor White }
    }
    
    # Failed Tests
    $failedTestResults = $TestResults | Where-Object { $_.Status -eq "FAIL" }
    if ($failedTestResults.Count -gt 0) {
        Write-Host "`n❌ FAILED TESTS:" -ForegroundColor Red
        $failedTestResults | ForEach-Object { 
            Write-Host "• $($_.TestName): $($_.Message)" -ForegroundColor White
            if ($_.Error) {
                Write-Host "  Error: $($_.Error)" -ForegroundColor Yellow
            }
        }
    }
    
    # Critical Errors
    $criticalErrors = $Errors | Where-Object { 
        $_.Type -eq "HTTP Error" -or 
        $_.Message -like "*ReferenceError*" -or 
        $_.Message -like "*TypeError*" -or 
        $_.Message -like "*is not defined*"
    }
    
    if ($criticalErrors.Count -gt 0) {
        Write-Host "`n🚨 CRITICAL ERRORS FOUND:" -ForegroundColor Red
        $criticalErrors | ForEach-Object { 
            Write-Host "• $($_.Type): $($_.Message)" -ForegroundColor White
        }
    }
    
    # Save detailed report
    $report = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Summary = @{
            TotalTests = $totalTests
            PassedTests = $passedTests
            FailedTests = $failedTests
            TotalErrors = $totalErrors
        }
        TestResults = $TestResults
        Errors = $Errors
        ErrorCategories = $errorCategories
    }
    
    $reportPath = "test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
    
    Write-Host "`n📄 Detailed report saved to: $reportPath" -ForegroundColor Green
    
    # Recommendations
    Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan
    if ($failedTests -eq 0) {
        Write-Host "🎉 All tests passed! Your website is working perfectly." -ForegroundColor Green
    } else {
        Write-Host "🔧 Fix the failed tests and errors listed above." -ForegroundColor Yellow
        Write-Host "🔍 Check browser console for additional runtime errors." -ForegroundColor Yellow
        Write-Host "📱 Test on different devices and browsers." -ForegroundColor Yellow
    }
}

# Run the tests
Start-WebsiteTesting





