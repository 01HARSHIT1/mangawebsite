import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
            return NextResponse.json({
                success: false,
                error: 'Missing Razorpay credentials'
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        console.log('🔍 Razorpay SDK methods available:');
        console.log('- orders:', typeof razorpay.orders);
        console.log('- payments:', typeof razorpay.payments);
        console.log('- qrCodes:', typeof razorpay.qrCodes);
        console.log('- qrCodes.create:', typeof razorpay.qrCodes?.create);

        // Check what methods are available
        const availableMethods = Object.getOwnPropertyNames(razorpay).filter(prop => 
            typeof razorpay[prop] === 'object' && razorpay[prop] !== null
        );

        console.log('📋 Available Razorpay methods:', availableMethods);

        // Try to access qrCodes specifically
        let qrCodesAvailable = false;
        let qrCodesError = null;

        try {
            if (razorpay.qrCodes) {
                console.log('✅ qrCodes object exists');
                if (typeof razorpay.qrCodes.create === 'function') {
                    console.log('✅ qrCodes.create method exists');
                    qrCodesAvailable = true;
                } else {
                    console.log('❌ qrCodes.create method does not exist');
                    qrCodesError = 'qrCodes.create method not available';
                }
            } else {
                console.log('❌ qrCodes object does not exist');
                qrCodesError = 'qrCodes object not available';
            }
        } catch (error) {
            console.error('❌ Error checking qrCodes:', error);
            qrCodesError = error instanceof Error ? error.message : 'Unknown error';
        }

        return NextResponse.json({
            success: true,
            razorpayVersion: 'latest',
            keyId: keyId.substring(0, 10) + '...',
            availableMethods,
            qrCodesSupport: {
                available: qrCodesAvailable,
                error: qrCodesError,
                hasQrCodesObject: !!razorpay.qrCodes,
                hasCreateMethod: typeof razorpay.qrCodes?.create === 'function'
            },
            sdkInfo: {
                orders: typeof razorpay.orders,
                payments: typeof razorpay.payments,
                qrCodes: typeof razorpay.qrCodes
            }
        });

    } catch (error) {
        console.error('❌ Test API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
