import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        // Check environment variables
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
            return NextResponse.json({
                error: 'Payment service not configured'
            }, { status: 500 });
        }

        // Dynamic import to prevent build-time evaluation
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const qrCodeId = searchParams.get('qrCodeId');

        if (!qrCodeId) {
            return NextResponse.json({
                error: 'QR code ID is required'
            }, { status: 400 });
        }

        console.log('🔍 Checking QR code status:', qrCodeId);

        // Fetch QR code details
        const qrCode = await razorpay.qrCodes.fetch(qrCodeId);

        console.log('✅ QR code status:', qrCode.status);

        return NextResponse.json({
            success: true,
            qrCodeId: qrCode.id,
            status: qrCode.status,
            amount: qrCode.payment_amount,
            currency: qrCode.currency,
            imageUrl: qrCode.image_url,
            shortUrl: qrCode.short_url,
            expiresAt: qrCode.close_by,
            payments: qrCode.payments || []
        });

    } catch (error) {
        console.error('❌ QR code status check failed:', error);
        const errorObj = error as any;
        
        return NextResponse.json({
            error: 'Failed to check QR code status',
            details: errorObj.error?.description || errorObj.message || 'Unknown error'
        }, { status: 500 });
    }
}
