# QUICK ERROR DETECTION SCRIPT
# This script helps identify current errors in the website

Write-Host "🔍 QUICK ERROR DETECTION SCRIPT" -ForegroundColor Magenta
Write-Host "===============================" -ForegroundColor Magenta
Write-Host ""

# Check for common error patterns
Write-Host "1. Checking for FaGrid references..." -ForegroundColor Yellow
$faGridCount = (Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "FaGrid" | Measure-Object).Count
if ($faGridCount -eq 0) {
    Write-Host "✅ No FaGrid references found" -ForegroundColor Green
} else {
    Write-Host "❌ Found $faGridCount FaGrid references" -ForegroundColor Red
    Write-Host "Files with FaGrid:" -ForegroundColor Yellow
    Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "FaGrid" | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor White }
}

Write-Host ""
Write-Host "2. Checking for connectToDatabase references..." -ForegroundColor Yellow
$connectCount = (Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "connectToDatabase" | Measure-Object).Count
if ($connectCount -eq 0) {
    Write-Host "✅ No connectToDatabase references found" -ForegroundColor Green
} else {
    Write-Host "❌ Found $connectCount connectToDatabase references" -ForegroundColor Red
    Write-Host "Files with connectToDatabase:" -ForegroundColor Yellow
    Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "connectToDatabase" | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor White }
}

Write-Host ""
Write-Host "3. Checking for FaSmile references..." -ForegroundColor Yellow
$faSmileCount = (Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "FaSmile" | Measure-Object).Count
if ($faSmileCount -gt 0) {
    Write-Host "✅ Found $faSmileCount FaSmile references (should be imported)" -ForegroundColor Green
} else {
    Write-Host "⚠️ No FaSmile references found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Testing website response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Website responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Website not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Testing key API endpoints..." -ForegroundColor Yellow
$apis = @(
    "http://localhost:3000/api/health",
    "http://localhost:3000/api/manga",
    "http://localhost:3000/api/notifications"
)

foreach ($api in $apis) {
    try {
        $response = Invoke-WebRequest -Uri $api -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $api : $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $api : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "6. Checking for common error patterns..." -ForegroundColor Yellow

# Check for common error patterns in code
$errorPatterns = @(
    @{Pattern="is not defined"; Description="Undefined variable errors"},
    @{Pattern="Cannot read property"; Description="Property access errors"},
    @{Pattern="Module not found"; Description="Import errors"},
    @{Pattern="Unexpected token"; Description="Syntax errors"},
    @{Pattern="is not a function"; Description="Function call errors"}
)

foreach ($pattern in $errorPatterns) {
    $count = (Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern $pattern.Pattern | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "⚠️ Found $count instances of: $($pattern.Description)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No instances of: $($pattern.Description)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "FaGrid errors: $faGridCount" -ForegroundColor White
Write-Host "connectToDatabase errors: $connectCount" -ForegroundColor White
Write-Host "FaSmile references: $faSmileCount" -ForegroundColor White

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Open browser and go to http://localhost:3000" -ForegroundColor White
Write-Host "2. Press F12 to open Developer Tools" -ForegroundColor White
Write-Host "3. Check Console tab for JavaScript errors" -ForegroundColor White
Write-Host "4. Check Network tab for failed requests" -ForegroundColor White
Write-Host "5. Follow the COMPREHENSIVE-MANUAL-TESTING-GUIDE.md" -ForegroundColor White
Write-Host "6. Test all pages and user flows" -ForegroundColor White
Write-Host "7. Document all errors found" -ForegroundColor White
Write-Host "8. Fix errors based on priority" -ForegroundColor White

Write-Host ""
Write-Host "🚨 CRITICAL: Check browser console for runtime errors!" -ForegroundColor Red
Write-Host "The terminal shows compilation warnings, but browser console shows runtime errors." -ForegroundColor Yellow





