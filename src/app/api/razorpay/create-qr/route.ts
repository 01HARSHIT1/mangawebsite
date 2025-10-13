import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Check environment variables
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
            console.error('❌ Missing Razorpay environment variables');
            return NextResponse.json({
                error: 'Payment service not configured',
                details: 'Razorpay credentials not found'
            }, { status: 500 });
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const user = await requireAuth(request);
        const { amount, currency = 'INR', description, metadata = {} } = await request.json();

        console.log('🔍 Creating QR code for amount:', amount, 'currency:', currency);

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json({ 
                error: 'Invalid amount', 
                details: `Amount must be greater than 0, received: ${amount}` 
            }, { status: 400 });
        }

        // Convert to paise for Razorpay
        const amountInPaise = Math.round(amount * 100);
        if (amountInPaise < 100) {
            return NextResponse.json({ 
                error: 'Amount too small', 
                details: 'Minimum amount is ₹1.00' 
            }, { status: 400 });
        }

        // Generate short receipt ID
        const timestamp = Date.now().toString().slice(-8);
        const userIdShort = user._id.toString().slice(-8);
        const receiptId = `qr_${timestamp}_${userIdShort}`;

        console.log('📦 Creating Razorpay QR code with params:', {
            amount: amountInPaise,
            currency,
            receipt: receiptId,
            receiptLength: receiptId.length
        });

        // Create QR code using Razorpay's qrCodes.create API
        const qrCode = await razorpay.qrCodes.create({
            type: 'upi_qr',
            name: `MangaReader Payment - ${description || 'Coins'}`,
            usage: 'single_use',
            fixed_amount: true,
            payment_amount: amountInPaise,
            description: description || 'MangaReader Payment',
            customer_id: user._id.toString(),
            close_by: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes from now
            notes: {
                userId: user._id.toString(),
                userEmail: user.email,
                description: description || 'MangaReader Payment',
                ...metadata
            }
        });

        console.log('✅ QR code created successfully:', qrCode.id);

        return NextResponse.json({
            success: true,
            qrCodeId: qrCode.id,
            imageUrl: qrCode.image_url,
            shortUrl: qrCode.short_url,
            amount: qrCode.payment_amount,
            currency: qrCode.currency,
            status: qrCode.status,
            expiresAt: qrCode.close_by,
            receipt: receiptId
        });

    } catch (error) {
        console.error('❌ QR code creation failed:', error);
        const errorObj = error as any;
        
        return NextResponse.json({
            error: 'Failed to create QR code',
            details: errorObj.error?.description || errorObj.message || 'Unknown error',
            razorpayError: {
                code: errorObj.error?.code,
                description: errorObj.error?.description,
                source: errorObj.error?.source,
                step: errorObj.error?.step,
                reason: errorObj.error?.reason
            }
        }, { status: 500 });
    }
}
