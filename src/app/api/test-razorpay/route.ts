import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const config = {
            hasKeyId: !!process.env.RAZORPAY_KEY_ID,
            hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
            hasWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
            keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 10) || 'NOT_FOUND',
            environment: process.env.NODE_ENV
        };

        console.log('🔍 Razorpay config check:', config);

        return NextResponse.json({
            success: true,
            config,
            message: config.hasKeyId && config.hasKeySecret ? 'Razorpay configured correctly' : 'Missing Razorpay credentials'
        });

    } catch (error) {
        console.error('❌ Razorpay config check failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
