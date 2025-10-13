import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        console.log('🔍 Testing Razorpay configuration...');
        console.log('Key ID exists:', !!keyId);
        console.log('Key Secret exists:', !!keySecret);
        console.log('Key ID length:', keyId?.length);
        console.log('Key ID starts with:', keyId?.substring(0, 10));

        if (!keyId || !keySecret) {
            return NextResponse.json({
                success: false,
                error: 'Missing Razorpay credentials',
                details: {
                    hasKeyId: !!keyId,
                    hasKeySecret: !!keySecret
                }
            }, { status: 500 });
        }

        // Try to initialize Razorpay
        let razorpay;
        try {
            razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
            console.log('✅ Razorpay SDK initialized');
        } catch (initError) {
            console.error('❌ Razorpay initialization failed:', initError);
            return NextResponse.json({
                success: false,
                error: 'Razorpay SDK initialization failed',
                details: initError instanceof Error ? initError.message : String(initError)
            }, { status: 500 });
        }

        // Try to create a test order
        try {
            const testOrder = await razorpay.orders.create({
                amount: 10000, // ₹100 in paise
                currency: 'INR',
                receipt: `test_${Date.now()}`,
                notes: {
                    test: 'true'
                }
            });

            console.log('✅ Test order created:', testOrder.id);

            return NextResponse.json({
                success: true,
                message: 'Razorpay is configured correctly',
                testOrderId: testOrder.id,
                testAmount: testOrder.amount,
                credentials: {
                    keyId: keyId.substring(0, 10) + '...',
                    keySecretLength: keySecret.length
                }
            });

        } catch (orderError) {
            console.error('❌ Test order creation failed:', orderError);
            const errorObj = orderError as any;
            
            return NextResponse.json({
                success: false,
                error: 'Failed to create test order',
                details: errorObj.error?.description || errorObj.message || String(orderError),
                razorpayError: {
                    code: errorObj.error?.code,
                    description: errorObj.error?.description,
                    source: errorObj.error?.source,
                    step: errorObj.error?.step,
                    reason: errorObj.error?.reason
                }
            }, { status: 500 });
        }

    } catch (error) {
        console.error('❌ Test API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Test failed',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

