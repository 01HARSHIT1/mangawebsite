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

        // Test different amounts
        const testAmounts = [
            { name: 'Starter ($0.99)', amount: 8217 }, // ₹82.17
            { name: 'Popular ($4.99)', amount: 41417 }, // ₹414.17
            { name: 'Premium ($9.99)', amount: 82917 }, // ₹829.17
        ];

        const results = [];

        for (const test of testAmounts) {
            try {
                console.log(`🧪 Testing QR code for ${test.name}: ${test.amount} paise`);
                
                const qrCode = await razorpay.qrCodes.create({
                    type: 'upi_qr',
                    name: `Test - ${test.name}`,
                    usage: 'single_use',
                    fixed_amount: true,
                    payment_amount: test.amount,
                    close_by: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
                    notes: {
                        test: true,
                        amount: test.amount
                    }
                });

                results.push({
                    name: test.name,
                    amount: test.amount,
                    success: true,
                    qrCodeId: qrCode.id,
                    imageUrl: qrCode.image_url,
                    status: qrCode.status
                });

                console.log(`✅ ${test.name} QR created successfully:`, qrCode.id);

            } catch (error: any) {
                console.error(`❌ ${test.name} QR creation failed:`, error);
                
                results.push({
                    name: test.name,
                    amount: test.amount,
                    success: false,
                    error: error.message,
                    razorpayError: {
                        code: error.error?.code,
                        description: error.error?.description,
                        source: error.error?.source,
                        step: error.error?.step,
                        reason: error.error?.reason,
                        field: error.error?.field
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });

    } catch (error) {
        console.error('❌ Test API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
