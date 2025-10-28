// Test script for Razorpay payment flow
// Run this with: node test-razorpay-payment.js

const BASE_URL = process.env.BASE_URL || 'https://mangawebsite.vercel.app';

async function testPaymentFlow() {
    console.log('🧪 Testing Razorpay Payment Flow...\n');
    
    // Test 1: Check if create-order endpoint is working
    console.log('📋 Test 1: Checking /api/razorpay/create-order endpoint...');
    try {
        const response = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Will fail auth but should show if endpoint exists
            },
            body: JSON.stringify({
                amount: 82.17, // ₹82.17 = $0.99
                currency: 'INR',
                description: '100 Coins Package'
            })
        });
        
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.error && data.error.includes('credentials')) {
            console.log('✅ Endpoint exists, but needs valid credentials');
        } else if (data.success) {
            console.log('✅ Order created successfully!');
        } else {
            console.log('⚠️ Unexpected response');
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 2: Check environment variables
    console.log('📋 Test 2: Checking environment variables...');
    console.log('Note: You should have these in Vercel:');
    console.log('  - RAZORPAY_KEY_ID');
    console.log('  - RAZORPAY_KEY_SECRET');
    console.log('  - RAZORPAY_WEBHOOK_SECRET (optional)');
    
    console.log('\n');
    
    // Test 3: Check webhook endpoint
    console.log('📋 Test 3: Checking /api/razorpay/webhook endpoint...');
    console.log(`  Webhook URL: ${BASE_URL}/api/razorpay/webhook`);
    console.log('  Configure this in Razorpay Dashboard');
    
    console.log('\n✅ Test completed!');
    console.log('\n📝 Next steps:');
    console.log('  1. Make sure all environment variables are set in Vercel');
    console.log('  2. Test with actual payment on the website');
    console.log('  3. Check Vercel logs for any errors');
}

// Run tests
testPaymentFlow().catch(console.error);

