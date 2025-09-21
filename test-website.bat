@echo off
echo 🚀 MANGA WEBSITE TESTING SUITE
echo ===============================
echo Testing URL: http://localhost:3000
echo.

set TOTAL=0
set PASSED=0
set FAILED=0

echo 📄 TESTING PUBLIC PAGES
echo ========================
call :TestPage "Homepage" "/"
call :TestPage "Browse Manga" "/manga"
call :TestPage "Series Page" "/series" 
call :TestPage "Genres Page" "/genres"
call :TestPage "Search Page" "/search"
call :TestPage "About Page" "/about"
call :TestPage "Contact Page" "/contact"
call :TestPage "Terms Page" "/terms"
call :TestPage "Privacy Page" "/privacy"
call :TestPage "Help Page" "/help"
call :TestPage "Pricing Page" "/pricing"
call :TestPage "Login Page" "/login"
call :TestPage "Signup Page" "/signup"

echo.
echo 🔌 TESTING API ENDPOINTS
echo =========================
call :TestPage "Manga List API" "/api/manga"
call :TestPage "Featured Manga API" "/api/manga?sort=featured&limit=5"
call :TestPage "Analytics API 1" "/api/manga/1/analytics"
call :TestPage "Analytics API 2" "/api/manga/2/analytics"
call :TestPage "Analytics API 3" "/api/manga/3/analytics"

echo.
echo 🔗 TESTING DYNAMIC PAGES
echo =========================
call :TestPage "Manga Details 1" "/manga/1"
call :TestPage "Manga Details 2" "/manga/2"
call :TestPage "Creator Dashboard" "/creator/dashboard"
call :TestPage "Upload Page" "/upload"
call :TestPage "Profile Page" "/profile"

echo.
echo 💰 TESTING PAYMENT PAGES
echo =========================
call :TestPage "Coins Purchase" "/coins"
call :TestPage "Coins History" "/coins/history"
call :TestPage "Payment Success" "/coins/success"

echo.
echo 📊 TEST SUMMARY
echo ===============
echo Total Tests: %TOTAL%
echo ✅ Passed: %PASSED%
echo ❌ Failed: %FAILED%
set /a SUCCESS_RATE=%PASSED%*100/%TOTAL%
echo 📊 Success Rate: %SUCCESS_RATE%%%

if %FAILED% GTR 0 (
    echo.
    echo ❌ Some tests failed - check the output above
    exit /b 1
) else (
    echo.
    echo ✅ ALL TESTS PASSED!
    exit /b 0
)

:TestPage
set /a TOTAL+=1
echo Testing: %~1
curl -s -o nul -w "%%{http_code}" "http://localhost:3000%~2" > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="200" (
    echo    ✅ PASS ^(%STATUS%^)
    set /a PASSED+=1
) else if "%STATUS%"=="404" (
    if "%~1"=="404 Page" (
        echo    ✅ PASS ^(%STATUS%^)
        set /a PASSED+=1
    ) else (
        echo    ❌ FAIL ^(%STATUS%^)
        set /a FAILED+=1
    )
) else (
    echo    ❌ FAIL ^(%STATUS%^)
    set /a FAILED+=1
)
goto :eof
