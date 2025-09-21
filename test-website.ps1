# PowerShell Manga Website Testing Script
# Comprehensive testing suite for Windows

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Detailed = $false
)

Write-Host "🚀 MANGA WEBSITE COMPREHENSIVE TESTING SUITE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Testing URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Started at: $(Get-Date)" -ForegroundColor Green
Write-Host ""

# Initialize counters
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$Warnings = 0
$TestResults = @()
$Errors = @()

# Function to test a single endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Category = "General"
    )
    
    $global:TotalTests++
    Write-Host "🧪 Testing: $Name" -ForegroundColor White
    
    try {
        $FullUrl = if ($Url.StartsWith("http")) { $Url } else { "$BaseUrl$Url" }
        $StartTime = Get-Date
        
        try {
            $Response = Invoke-WebRequest -Uri $FullUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
            $LoadTime = (Get-Date) - $StartTime
            
            if ($Response.StatusCode -eq $ExpectedStatus) {
                $global:PassedTests++
                Write-Host "   ✅ PASS - Status: $($Response.StatusCode) - Time: $($LoadTime.TotalMilliseconds)ms" -ForegroundColor Green
                
                # Check for performance warnings
                if ($LoadTime.TotalMilliseconds -gt 2000) {
                    $global:Warnings++
                    Write-Host "   ⚠️  SLOW - Load time over 2 seconds" -ForegroundColor Yellow
                }
                
                $global:TestResults += [PSCustomObject]@{
                    Name         = $Name
                    Category     = $Category
                    Url          = $FullUrl
                    Status       = "PASS"
                    StatusCode   = $Response.StatusCode
                    LoadTime     = $LoadTime.TotalMilliseconds
                    ResponseSize = $Response.Content.Length
                }
                
                return $true
            }
            else {
                $global:FailedTests++
                $Error = "$Name: Expected $ExpectedStatus, got $($Response.StatusCode)"
                $global:Errors += $Error
                Write-Host "   ❌ FAIL - Expected: $ExpectedStatus, Got: $($Response.StatusCode)" -ForegroundColor Red
                
                $global:TestResults += [PSCustomObject]@{
                    Name       = $Name
                    Category   = $Category
                    Url        = $FullUrl
                    Status     = "FAIL"
                    StatusCode = $Response.StatusCode
                    Expected   = $ExpectedStatus
                    Error      = "Status code mismatch"
                }
                
                return $false
            }
        }
        catch {
            $global:FailedTests++
            $ErrorMsg = $_.Exception.Message
            $global:Errors += "$Name: $ErrorMsg"
            Write-Host "   💥 ERROR - $ErrorMsg" -ForegroundColor Red
            
            $global:TestResults += [PSCustomObject]@{
                Name     = $Name
                Category = $Category
                Url      = $FullUrl
                Status   = "ERROR"
                Error    = $ErrorMsg
            }
            
            return $false
        }
    }
    catch {
        Write-Host "   💥 CRITICAL ERROR - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Start-Sleep -Milliseconds 100
}

# Test Public Pages
Write-Host "`n📄 TESTING PUBLIC PAGES" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$PublicPages = @(
    @("Homepage", "/"),
    @("Browse Manga", "/manga"),
    @("Series Page", "/series"),
    @("Genres Page", "/genres"),
    @("Search Page", "/search"),
    @("About Page", "/about"),
    @("Contact Page", "/contact"),
    @("Terms Page", "/terms"),
    @("Privacy Page", "/privacy"),
    @("Help Page", "/help"),
    @("Pricing Page", "/pricing"),
    @("Login Page", "/login"),
    @("Signup Page", "/signup")
)

foreach ($Page in $PublicPages) {
    Test-Endpoint -Name $Page[0] -Url $Page[1] -Category "Public Pages"
}

# Test API Endpoints
Write-Host "`n🔌 TESTING API ENDPOINTS" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$ApiEndpoints = @(
    @("Manga List API", "/api/manga"),
    @("Featured Manga API", "/api/manga?sort=featured&limit=5"),
    @("Trending Manga API", "/api/manga?sort=trending&limit=10"),
    @("Search API", "/api/manga?search=dragon"),
    @("Genre Filter API", "/api/manga?genre=Fantasy"),
    @("Manga Analytics API 1", "/api/manga/1/analytics"),
    @("Manga Analytics API 2", "/api/manga/2/analytics"),
    @("Manga Analytics API 3", "/api/manga/3/analytics"),
    @("Admin Stats API", "/api/admin/stats"),
    @("System Health API", "/api/admin/system-health")
)

foreach ($Api in $ApiEndpoints) {
    Test-Endpoint -Name $Api[0] -Url $Api[1] -Category "API Endpoints"
}

# Test Dynamic Pages
Write-Host "`n🔗 TESTING DYNAMIC PAGES" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$DynamicPages = @(
    @("Manga Details Page 1", "/manga/1"),
    @("Manga Details Page 2", "/manga/2"),
    @("Manga Details Page 3", "/manga/3"),
    @("Chapter Reader Page", "/manga/1/chapter/1"),
    @("Creator Dashboard", "/creator/dashboard"),
    @("Creator Analytics", "/creator/analytics"),
    @("Upload Page", "/upload"),
    @("Admin Dashboard", "/admin/dashboard"),
    @("My Profile", "/profile")
)

foreach ($Page in $DynamicPages) {
    Test-Endpoint -Name $Page[0] -Url $Page[1] -Category "Dynamic Pages"
}

# Test Payment Pages
Write-Host "`n💰 TESTING PAYMENT PAGES" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$PaymentPages = @(
    @("Coins Purchase Page", "/coins"),
    @("Coins History Page", "/coins/history"),
    @("Payment Success Page", "/coins/success"),
    @("Payment Cancel Page", "/coins/cancel")
)

foreach ($Page in $PaymentPages) {
    Test-Endpoint -Name $Page[0] -Url $Page[1] -Category "Payment System"
}

# Test Error Handling
Write-Host "`n❌ TESTING ERROR HANDLING" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

Test-Endpoint -Name "404 Page" -Url "/nonexistent-page" -ExpectedStatus 404 -Category "Error Handling"
Test-Endpoint -Name "Invalid Manga ID" -Url "/manga/invalid-id" -ExpectedStatus 200 -Category "Error Handling"

# Generate Summary Report
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$SuccessRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 2) } else { 0 }

Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "✅ Passed: $PassedTests" -ForegroundColor Green
Write-Host "❌ Failed: $FailedTests" -ForegroundColor Red
Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "📊 Success Rate: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 90) { "Green" } elseif ($SuccessRate -ge 70) { "Yellow" } else { "Red" })

if ($Errors.Count -gt 0) {
    Write-Host "`n🔥 CRITICAL ISSUES:" -ForegroundColor Red
    for ($i = 0; $i -lt $Errors.Count; $i++) {
        Write-Host "$($i + 1). $($Errors[$i])" -ForegroundColor Red
    }
}

# Save detailed report
$ReportPath = "manga-website-test-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
$Report = @{
    Timestamp       = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    Summary         = @{
        TotalTests  = $TotalTests
        Passed      = $PassedTests
        Failed      = $FailedTests
        Warnings    = $Warnings
        SuccessRate = "$SuccessRate%"
    }
    TestResults     = $TestResults
    Errors          = $Errors
    Recommendations = @(
        if ($FailedTests -gt 0) { "Fix failing endpoints and pages" }
        if ($Warnings -gt 0) { "Optimize slow-loading pages" }
        if ($SuccessRate -lt 90) { "Overall success rate below 90% - requires attention" }
        "Consider implementing automated testing"
        "Add monitoring for production environment"
    )
}

$Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan
if ($FailedTests -gt 0) {
    Write-Host "1. Fix failing endpoints and pages" -ForegroundColor Yellow
}
if ($Warnings -gt 0) {
    Write-Host "2. Optimize slow-loading pages" -ForegroundColor Yellow
}
if ($SuccessRate -lt 90) {
    Write-Host "3. Overall success rate below 90% - requires immediate attention" -ForegroundColor Red
}

Write-Host "`n📄 Full report saved to: $ReportPath" -ForegroundColor Green
Write-Host "🏁 Testing completed at: $(Get-Date)" -ForegroundColor Green

# Return exit code based on results
if ($FailedTests -gt 0) {
    Write-Host "`n❌ TESTING FAILED - Some tests did not pass" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "`n✅ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
}
