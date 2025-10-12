#!/usr/bin/env node

/**
 * COMPREHENSIVE WEBSITE TESTING SCRIPT
 * Tests the complete user journey and identifies runtime errors
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class WebsiteTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.errors = [];
        this.testResults = [];
        this.baseUrl = 'http://localhost:3000';
    }

    async init() {
        console.log('🚀 Starting Comprehensive Website Testing...\n');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless testing
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.errors.push({
                    type: 'Console Error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Enable page error logging
        this.page.on('pageerror', error => {
            this.errors.push({
                type: 'Page Error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Enable request failure logging
        this.page.on('requestfailed', request => {
            this.errors.push({
                type: 'Request Failed',
                url: request.url(),
                errorText: request.failure().errorText,
                timestamp: new Date().toISOString()
            });
        });
    }

    async testStep(stepName, testFunction) {
        console.log(`\n📋 Testing: ${stepName}`);
        try {
            const result = await testFunction();
            this.testResults.push({
                step: stepName,
                status: 'PASS',
                result: result,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ ${stepName}: PASSED`);
            return result;
        } catch (error) {
            this.testResults.push({
                step: stepName,
                status: 'FAIL',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`❌ ${stepName}: FAILED - ${error.message}`);
            this.errors.push({
                type: 'Test Error',
                step: stepName,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return null;
        }
    }

    async runTests() {
        await this.init();

        // PHASE 1: ANONYMOUS USER TESTING
        console.log('\n🔍 PHASE 1: ANONYMOUS USER TESTING');
        console.log('=====================================');

        await this.testStep('1.1 - Load Homepage', async () => {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Homepage loaded successfully';
        });

        await this.testStep('1.2 - Test Homepage Navigation', async () => {
            // Test navigation links
            const navLinks = await this.page.$$eval('nav a', links =>
                links.map(link => ({ text: link.textContent, href: link.href }))
            );
            return `Found ${navLinks.length} navigation links`;
        });

        await this.testStep('1.3 - Test Manga Browse Page', async () => {
            await this.page.goto(`${this.baseUrl}/manga`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Manga browse page loaded';
        });

        await this.testStep('1.4 - Test Manga Search', async () => {
            const searchInput = await this.page.$('input[type="text"]');
            if (searchInput) {
                await searchInput.type('dragon');
                await this.page.keyboard.press('Enter');
                await this.page.waitForTimeout(2000);
                return 'Search functionality tested';
            }
            throw new Error('Search input not found');
        });

        await this.testStep('1.5 - Test Manga Details Page', async () => {
            // Try to click on first manga card
            const mangaCards = await this.page.$$('[data-testid="manga-card"], .group.cursor-pointer');
            if (mangaCards.length > 0) {
                await mangaCards[0].click();
                await this.page.waitForTimeout(2000);
                return 'Manga details page accessed';
            }
            throw new Error('No manga cards found');
        });

        await this.testStep('1.6 - Test Genres Page', async () => {
            await this.page.goto(`${this.baseUrl}/genres`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Genres page loaded';
        });

        await this.testStep('1.7 - Test About Page', async () => {
            await this.page.goto(`${this.baseUrl}/about`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'About page loaded';
        });

        // PHASE 2: AUTHENTICATION TESTING
        console.log('\n🔐 PHASE 2: AUTHENTICATION TESTING');
        console.log('===================================');

        await this.testStep('2.1 - Test Signup Page', async () => {
            await this.page.goto(`${this.baseUrl}/signup`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Signup page loaded';
        });

        await this.testStep('2.2 - Test Signup Form', async () => {
            const emailInput = await this.page.$('input[type="email"]');
            const passwordInput = await this.page.$('input[type="password"]');
            const usernameInput = await this.page.$('input[name="username"]');

            if (emailInput && passwordInput && usernameInput) {
                await usernameInput.type('testuser' + Date.now());
                await emailInput.type('test' + Date.now() + '@example.com');
                await passwordInput.type('testpassword123');

                const submitButton = await this.page.$('button[type="submit"]');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(3000);
                    return 'Signup form submitted';
                }
            }
            throw new Error('Signup form elements not found');
        });

        await this.testStep('2.3 - Test Login Page', async () => {
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Login page loaded';
        });

        await this.testStep('2.4 - Test Login Form', async () => {
            const emailInput = await this.page.$('input[type="email"]');
            const passwordInput = await this.page.$('input[type="password"]');

            if (emailInput && passwordInput) {
                await emailInput.type('test@example.com');
                await passwordInput.type('testpassword123');

                const submitButton = await this.page.$('button[type="submit"]');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(3000);
                    return 'Login form submitted';
                }
            }
            throw new Error('Login form elements not found');
        });

        // PHASE 3: AUTHENTICATED USER TESTING
        console.log('\n👤 PHASE 3: AUTHENTICATED USER TESTING');
        console.log('======================================');

        await this.testStep('3.1 - Test User Profile', async () => {
            await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Profile page loaded';
        });

        await this.testStep('3.2 - Test User Library', async () => {
            await this.page.goto(`${this.baseUrl}/library`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Library page loaded';
        });

        await this.testStep('3.3 - Test Reading Stats', async () => {
            await this.page.goto(`${this.baseUrl}/stats`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Stats page loaded';
        });

        await this.testStep('3.4 - Test Notifications', async () => {
            await this.page.goto(`${this.baseUrl}/notifications`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Notifications page loaded';
        });

        // PHASE 4: CREATOR FEATURES TESTING
        console.log('\n🎨 PHASE 4: CREATOR FEATURES TESTING');
        console.log('====================================');

        await this.testStep('4.1 - Test Creator Panel', async () => {
            await this.page.goto(`${this.baseUrl}/creator-panel`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Creator panel loaded';
        });

        await this.testStep('4.2 - Test Creator Dashboard', async () => {
            await this.page.goto(`${this.baseUrl}/creator/dashboard`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Creator dashboard loaded';
        });

        await this.testStep('4.3 - Test Creator Analytics', async () => {
            await this.page.goto(`${this.baseUrl}/creator/analytics`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Creator analytics loaded';
        });

        await this.testStep('4.4 - Test Upload Page', async () => {
            await this.page.goto(`${this.baseUrl}/upload`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Upload page loaded';
        });

        // PHASE 5: ADMIN FEATURES TESTING
        console.log('\n👑 PHASE 5: ADMIN FEATURES TESTING');
        console.log('==================================');

        await this.testStep('5.1 - Test Admin Dashboard', async () => {
            await this.page.goto(`${this.baseUrl}/admin/dashboard`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Admin dashboard loaded';
        });

        await this.testStep('5.2 - Test Admin Users', async () => {
            await this.page.goto(`${this.baseUrl}/admin/users`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Admin users page loaded';
        });

        // PHASE 6: MONETIZATION TESTING
        console.log('\n💰 PHASE 6: MONETIZATION TESTING');
        console.log('=================================');

        await this.testStep('6.1 - Test Coins Page', async () => {
            await this.page.goto(`${this.baseUrl}/coins`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Coins page loaded';
        });

        await this.testStep('6.2 - Test Pricing Page', async () => {
            await this.page.goto(`${this.baseUrl}/pricing`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Pricing page loaded';
        });

        // PHASE 7: UTILITY PAGES TESTING
        console.log('\nℹ️ PHASE 7: UTILITY PAGES TESTING');
        console.log('==================================');

        await this.testStep('7.1 - Test Contact Page', async () => {
            await this.page.goto(`${this.baseUrl}/contact`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Contact page loaded';
        });

        await this.testStep('7.2 - Test Help Page', async () => {
            await this.page.goto(`${this.baseUrl}/help`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Help page loaded';
        });

        await this.testStep('7.3 - Test Terms Page', async () => {
            await this.page.goto(`${this.baseUrl}/terms`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Terms page loaded';
        });

        await this.testStep('7.4 - Test Privacy Page', async () => {
            await this.page.goto(`${this.baseUrl}/privacy`, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            return 'Privacy page loaded';
        });

        // PHASE 8: INTERACTIVE FEATURES TESTING
        console.log('\n🎮 PHASE 8: INTERACTIVE FEATURES TESTING');
        console.log('========================================');

        await this.testStep('8.1 - Test Manga Reading', async () => {
            await this.page.goto(`${this.baseUrl}/manga`, { waitUntil: 'networkidle0' });
            const mangaCards = await this.page.$$('[data-testid="manga-card"], .group.cursor-pointer');
            if (mangaCards.length > 0) {
                await mangaCards[0].click();
                await this.page.waitForTimeout(2000);

                // Try to find and click chapter link
                const chapterLinks = await this.page.$$('a[href*="/chapter/"]');
                if (chapterLinks.length > 0) {
                    await chapterLinks[0].click();
                    await this.page.waitForTimeout(2000);
                    return 'Manga reading interface accessed';
                }
            }
            throw new Error('Could not access manga reading interface');
        });

        await this.testStep('8.2 - Test Search Functionality', async () => {
            await this.page.goto(`${this.baseUrl}/manga`, { waitUntil: 'networkidle0' });
            const searchInput = await this.page.$('input[type="text"]');
            if (searchInput) {
                await searchInput.type('test');
                await this.page.keyboard.press('Enter');
                await this.page.waitForTimeout(2000);
                return 'Search functionality tested';
            }
            throw new Error('Search input not found');
        });

        await this.testStep('8.3 - Test Filter Functionality', async () => {
            await this.page.goto(`${this.baseUrl}/manga`, { waitUntil: 'networkidle0' });
            const filterButtons = await this.page.$$('button');
            for (const button of filterButtons) {
                const text = await button.evaluate(el => el.textContent);
                if (text && text.toLowerCase().includes('filter')) {
                    await button.click();
                    await this.page.waitForTimeout(1000);
                    break;
                }
            }
            return 'Filter functionality tested';
        });

        await this.generateReport();
    }

    async generateReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT');
        console.log('=======================================');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passedTests: this.testResults.filter(t => t.status === 'PASS').length,
                failedTests: this.testResults.filter(t => t.status === 'FAIL').length,
                totalErrors: this.errors.length
            },
            testResults: this.testResults,
            errors: this.errors,
            errorCategories: this.categorizeErrors()
        };

        // Save report to file
        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Display summary
        console.log(`\n📈 TEST SUMMARY:`);
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`✅ Passed: ${report.summary.passedTests}`);
        console.log(`❌ Failed: ${report.summary.failedTests}`);
        console.log(`🐛 Errors: ${report.summary.totalErrors}`);

        // Display error categories
        console.log(`\n🐛 ERROR CATEGORIES:`);
        Object.entries(report.errorCategories).forEach(([category, count]) => {
            console.log(`${category}: ${count} errors`);
        });

        // Display critical errors
        const criticalErrors = this.errors.filter(e =>
            e.type === 'Page Error' ||
            e.message.includes('ReferenceError') ||
            e.message.includes('TypeError') ||
            e.message.includes('is not defined')
        );

        if (criticalErrors.length > 0) {
            console.log(`\n🚨 CRITICAL ERRORS FOUND:`);
            criticalErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.type}: ${error.message}`);
            });
        }

        console.log(`\n📄 Full report saved to: ${reportPath}`);

        await this.browser.close();
    }

    categorizeErrors() {
        const categories = {};
        this.errors.forEach(error => {
            const category = error.type || 'Unknown';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }
}

// Run the tests
const tester = new WebsiteTester();
tester.runTests().catch(console.error);





