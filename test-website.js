#!/usr/bin/env node

/**
 * Comprehensive Manga Website Testing Suite
 * Tests all pages, APIs, and workflows systematically
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class MangaWebsiteTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            warnings: [],
            summary: {}
        };
        this.testCategories = {
            'Public Pages': [],
            'Authentication': [],
            'Creator Pages': [],
            'Admin Pages': [],
            'API Endpoints': [],
            'Payment System': [],
            'User Workflows': []
        };
    }

    // Utility function to make HTTP requests
    async makeRequest(url, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            const urlObj = new URL(fullUrl);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 3000,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'MangaWebsite-Tester/1.0',
                    ...headers
                }
            };

            if (data && method !== 'GET') {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData,
                        url: fullUrl
                    });
                });
            });

            req.on('error', (error) => {
                reject({
                    error: error.message,
                    url: fullUrl
                });
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Test a single page/endpoint
    async testEndpoint(name, url, expectedStatus = 200, category = 'General') {
        this.results.totalTests++;

        try {
            console.log(`🧪 Testing: ${name}`);
            const response = await this.makeRequest(url);

            if (response.statusCode === expectedStatus) {
                this.results.passed++;
                this.testCategories[category].push({
                    name,
                    url,
                    status: 'PASS',
                    statusCode: response.statusCode,
                    responseSize: response.data.length
                });
                console.log(`   ✅ PASS - Status: ${response.statusCode}`);
                return true;
            } else {
                this.results.failed++;
                this.results.errors.push(`${name}: Expected ${expectedStatus}, got ${response.statusCode}`);
                this.testCategories[category].push({
                    name,
                    url,
                    status: 'FAIL',
                    statusCode: response.statusCode,
                    expected: expectedStatus,
                    error: `Status code mismatch`
                });
                console.log(`   ❌ FAIL - Expected: ${expectedStatus}, Got: ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`${name}: ${error.error || error.message}`);
            this.testCategories[category].push({
                name,
                url,
                status: 'ERROR',
                error: error.error || error.message
            });
            console.log(`   💥 ERROR - ${error.error || error.message}`);
            return false;
        }
    }

    // Test API with JSON response
    async testAPI(name, url, expectedStatus = 200, category = 'API Endpoints') {
        this.results.totalTests++;

        try {
            console.log(`🔌 Testing API: ${name}`);
            const response = await this.makeRequest(url);

            if (response.statusCode === expectedStatus) {
                let jsonData = null;
                try {
                    jsonData = JSON.parse(response.data);
                } catch (e) {
                    // Not JSON, that's okay for some endpoints
                }

                this.results.passed++;
                this.testCategories[category].push({
                    name,
                    url,
                    status: 'PASS',
                    statusCode: response.statusCode,
                    hasJSON: !!jsonData,
                    responseSize: response.data.length
                });
                console.log(`   ✅ PASS - Status: ${response.statusCode} ${jsonData ? '(JSON)' : '(HTML)'}`);
                return { success: true, data: jsonData };
            } else {
                this.results.failed++;
                this.results.errors.push(`${name}: Expected ${expectedStatus}, got ${response.statusCode}`);
                this.testCategories[category].push({
                    name,
                    url,
                    status: 'FAIL',
                    statusCode: response.statusCode,
                    expected: expectedStatus
                });
                console.log(`   ❌ FAIL - Expected: ${expectedStatus}, Got: ${response.statusCode}`);
                return { success: false };
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`${name}: ${error.error || error.message}`);
            this.testCategories[category].push({
                name,
                url,
                status: 'ERROR',
                error: error.error || error.message
            });
            console.log(`   💥 ERROR - ${error.error || error.message}`);
            return { success: false, error };
        }
    }

    // Test all public pages
    async testPublicPages() {
        console.log('\n📄 TESTING PUBLIC PAGES');
        console.log('========================');

        const publicPages = [
            ['Homepage', '/'],
            ['Browse Manga', '/manga'],
            ['Series Page', '/series'],
            ['Genres Page', '/genres'],
            ['Search Page', '/search'],
            ['About Page', '/about'],
            ['Contact Page', '/contact'],
            ['Terms Page', '/terms'],
            ['Privacy Page', '/privacy'],
            ['Help Page', '/help'],
            ['Pricing Page', '/pricing'],
            ['Login Page', '/login'],
            ['Signup Page', '/signup']
        ];

        for (const [name, url] of publicPages) {
            await this.testEndpoint(name, url, 200, 'Public Pages');
            await this.sleep(100); // Small delay between requests
        }
    }

    // Test all API endpoints
    async testAPIEndpoints() {
        console.log('\n🔌 TESTING API ENDPOINTS');
        console.log('=========================');

        const apiEndpoints = [
            ['Manga List API', '/api/manga'],
            ['Featured Manga API', '/api/manga?sort=featured&limit=5'],
            ['Trending Manga API', '/api/manga?sort=trending&limit=10'],
            ['Search API', '/api/manga?search=dragon'],
            ['Genre Filter API', '/api/manga?genre=Fantasy'],
            ['Manga Analytics API', '/api/manga/1/analytics'],
            ['Manga Analytics API 2', '/api/manga/2/analytics'],
            ['Manga Analytics API 3', '/api/manga/3/analytics'],
            ['Admin Stats API', '/api/admin/stats'],
            ['System Health API', '/api/admin/system-health'],
            ['Notifications API', '/api/notifications'],
            ['Coins API Test', '/api/coins/history']
        ];

        for (const [name, url] of apiEndpoints) {
            await this.testAPI(name, url, 200, 'API Endpoints');
            await this.sleep(100);
        }
    }

    // Test dynamic pages with parameters
    async testDynamicPages() {
        console.log('\n🔗 TESTING DYNAMIC PAGES');
        console.log('=========================');

        const dynamicPages = [
            ['Manga Details Page 1', '/manga/1'],
            ['Manga Details Page 2', '/manga/2'],
            ['Manga Details Page 3', '/manga/3'],
            ['Chapter Reader Page', '/manga/1/chapter/1'],
            ['User Profile Page', '/users/testuser'],
            ['Creator Dashboard', '/creator/dashboard'],
            ['Creator Analytics', '/creator/analytics'],
            ['Upload Page', '/upload'],
            ['Admin Dashboard', '/admin/dashboard'],
            ['Admin Users', '/admin/users'],
            ['My Profile', '/profile']
        ];

        for (const [name, url] of dynamicPages) {
            await this.testEndpoint(name, url, 200, 'Dynamic Pages');
            await this.sleep(100);
        }
    }

    // Test payment related pages
    async testPaymentPages() {
        console.log('\n💰 TESTING PAYMENT PAGES');
        console.log('=========================');

        const paymentPages = [
            ['Coins Purchase Page', '/coins'],
            ['Coins History Page', '/coins/history'],
            ['Payment Success Page', '/coins/success'],
            ['Payment Cancel Page', '/coins/cancel'],
            ['Pricing Page', '/pricing']
        ];

        for (const [name, url] of paymentPages) {
            await this.testEndpoint(name, url, 200, 'Payment System');
            await this.sleep(100);
        }
    }

    // Test error pages
    async testErrorPages() {
        console.log('\n❌ TESTING ERROR HANDLING');
        console.log('==========================');

        const errorTests = [
            ['404 Page', '/nonexistent-page', 404],
            ['Invalid Manga ID', '/manga/invalid-id', 200], // Should handle gracefully
            ['Invalid API Call', '/api/nonexistent', 404]
        ];

        for (const [name, url, expectedStatus] of errorTests) {
            await this.testEndpoint(name, url, expectedStatus, 'Error Handling');
            await this.sleep(100);
        }
    }

    // Test website performance
    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE');
        console.log('======================');

        const performanceTests = [
            ['Homepage Load Time', '/'],
            ['Browse Page Load Time', '/manga'],
            ['API Response Time', '/api/manga?limit=5']
        ];

        for (const [name, url] of performanceTests) {
            const startTime = Date.now();
            const result = await this.testEndpoint(name, url, 200, 'Performance');
            const loadTime = Date.now() - startTime;

            if (result) {
                if (loadTime < 2000) {
                    console.log(`   ⚡ Performance: ${loadTime}ms (GOOD)`);
                } else if (loadTime < 5000) {
                    console.log(`   ⚠️  Performance: ${loadTime}ms (SLOW)`);
                    this.results.warnings.push(`${name}: Slow load time (${loadTime}ms)`);
                } else {
                    console.log(`   🐌 Performance: ${loadTime}ms (VERY SLOW)`);
                    this.results.warnings.push(`${name}: Very slow load time (${loadTime}ms)`);
                }
            }
            await this.sleep(100);
        }
    }

    // Test user workflows
    async testUserWorkflows() {
        console.log('\n👤 TESTING USER WORKFLOWS');
        console.log('==========================');

        // Test registration workflow (will fail without actual form submission, but tests page access)
        await this.testEndpoint('Registration Flow - Access', '/signup', 200, 'User Workflows');
        await this.testEndpoint('Login Flow - Access', '/login', 200, 'User Workflows');
        await this.testEndpoint('Upload Flow - Access', '/upload', 200, 'User Workflows');
        await this.testEndpoint('Profile Flow - Access', '/profile', 200, 'User Workflows');
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Generate comprehensive test report
    generateReport() {
        console.log('\n📊 GENERATING TEST REPORT');
        console.log('==========================');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.results.totalTests,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings.length,
                successRate: ((this.results.passed / this.results.totalTests) * 100).toFixed(2) + '%'
            },
            categories: this.testCategories,
            errors: this.results.errors,
            warnings: this.results.warnings,
            recommendations: this.generateRecommendations()
        };

        // Save report to file
        const reportPath = 'manga-website-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.failed > 0) {
            recommendations.push('Fix failing endpoints and pages');
        }

        if (this.results.warnings.length > 0) {
            recommendations.push('Optimize slow-loading pages');
        }

        if (this.results.passed / this.results.totalTests < 0.9) {
            recommendations.push('Overall success rate is below 90% - requires attention');
        }

        recommendations.push('Consider implementing automated testing in CI/CD pipeline');
        recommendations.push('Add monitoring for production environment');

        return recommendations;
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE MANGA WEBSITE TESTING');
        console.log('================================================');
        console.log(`Testing URL: ${this.baseUrl}`);
        console.log(`Started at: ${new Date().toISOString()}\n`);

        try {
            // Test if server is running
            await this.testEndpoint('Server Health Check', '/', 200, 'Health Check');

            // Run all test suites
            await this.testPublicPages();
            await this.testAPIEndpoints();
            await this.testDynamicPages();
            await this.testPaymentPages();
            await this.testErrorPages();
            await this.testPerformance();
            await this.testUserWorkflows();

        } catch (error) {
            console.error('💥 CRITICAL ERROR:', error);
            this.results.errors.push(`Critical Error: ${error.message}`);
        }

        // Generate and display report
        const report = this.generateReport();
        this.displaySummary(report);

        return report;
    }

    displaySummary(report) {
        console.log('\n🎯 TEST SUMMARY');
        console.log('================');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⚠️  Warnings: ${report.summary.warnings}`);
        console.log(`📊 Success Rate: ${report.summary.successRate}`);

        if (report.errors.length > 0) {
            console.log('\n🔥 CRITICAL ISSUES:');
            report.errors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }

        if (report.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            report.warnings.forEach((warning, i) => {
                console.log(`${i + 1}. ${warning}`);
            });
        }

        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });

        console.log(`\n📄 Full report saved to: manga-website-test-report.json`);
        console.log(`🏁 Testing completed at: ${new Date().toISOString()}`);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new MangaWebsiteTester();
    tester.runAllTests().then((report) => {
        process.exit(report.summary.failed > 0 ? 1 : 0);
    }).catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = MangaWebsiteTester;
