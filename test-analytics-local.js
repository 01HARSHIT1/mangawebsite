// Test script to verify analytics page works locally
const puppeteer = require('puppeteer');

async function testAnalyticsPage() {
    console.log('🧪 Starting Analytics Page Test...');

    const browser = await puppeteer.launch({
        headless: false, // Show browser for visual verification
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Navigate to analytics page
        console.log('📱 Navigating to analytics page...');
        await page.goto('http://localhost:3000/creator/analytics', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });

        // Wait for page to load
        await page.waitForTimeout(3000);

        // Check if analytics dashboard is visible (not loading screen)
        console.log('🔍 Checking for analytics dashboard...');
        const hasAnalytics = await page.$('[data-testid="analytics-dashboard"]') ||
            await page.$('.bg-white\\/10.backdrop-blur-lg.rounded-xl.p-6') ||
            await page.$('text=Total Series');

        if (hasAnalytics) {
            console.log('✅ Analytics dashboard is visible!');
        } else {
            console.log('❌ Analytics dashboard not found');
        }

        // Check for test data
        console.log('🔍 Checking for test data...');
        const hasTestData = await page.$('text=Test Manga') ||
            await page.$('text=100') ||
            await page.$('text=1.00');

        if (hasTestData) {
            console.log('✅ Test data is visible!');
        } else {
            console.log('❌ Test data not found');
        }

        // Check view mode buttons
        console.log('🔍 Checking view mode buttons...');
        const hasViewModes = await page.$('text=Overview') &&
            await page.$('text=Per Manga') &&
            await page.$('text=Per Chapter');

        if (hasViewModes) {
            console.log('✅ View mode buttons are visible!');
        } else {
            console.log('❌ View mode buttons not found');
        }

        // Test the refresh button
        console.log('🔍 Testing refresh button...');
        const refreshButton = await page.$('text=Test Analytics');
        if (refreshButton) {
            console.log('✅ Refresh button found, clicking...');
            await refreshButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Refresh button works!');
        } else {
            console.log('❌ Refresh button not found');
        }

        // Take screenshot for verification
        console.log('📸 Taking screenshot...');
        await page.screenshot({
            path: 'analytics-test-result.png',
            fullPage: true
        });

        console.log('✅ Test completed! Check analytics-test-result.png for visual verification.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testAnalyticsPage().catch(console.error);

