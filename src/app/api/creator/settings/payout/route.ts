import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PayoutMethod = 'upi' | 'bank';

const allowedVerificationStatuses = ['pending', 'verified', 'rejected'] as const;

function sanitizePayoutPayload(body: any) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid payload');
    }

    const errors: Record<string, string> = {};
    const update: any = {};

    const method: PayoutMethod = body.method === 'bank' ? 'bank' : 'upi';
    update['payoutInfo.method'] = method;

    if (method === 'upi') {
        if (!body.upiId || typeof body.upiId !== 'string') {
            errors.upiId = 'UPI ID is required';
        } else {
            update['payoutInfo.upiId'] = body.upiId.trim();
        }
        update['payoutInfo.bank'] = null;
    }

    if (method === 'bank') {
        const accountHolder = typeof body.accountHolder === 'string' ? body.accountHolder.trim() : '';
        const accountNumber = typeof body.accountNumber === 'string' ? body.accountNumber.trim() : '';
        const ifsc = typeof body.ifsc === 'string' ? body.ifsc.trim().toUpperCase() : '';
        const bankName = typeof body.bankName === 'string' ? body.bankName.trim() : '';

        if (!accountHolder) errors.accountHolder = 'Account holder name is required';
        if (!accountNumber) errors.accountNumber = 'Account number is required';
        if (!ifsc) errors.ifsc = 'IFSC code is required';
        if (!bankName) errors.bankName = 'Bank name is required';

        update['payoutInfo.bank'] = {
            accountHolder,
            accountNumber,
            ifsc,
            bankName
        };
        update['payoutInfo.upiId'] = null;
    }

    const taxId = typeof body.taxId === 'string' ? body.taxId.trim() : '';
    if (taxId) {
        update['payoutInfo.taxId'] = taxId;
    } else {
        update['payoutInfo.taxId'] = '';
    }

    if (body.razorpayAccountId !== undefined) {
        if (body.razorpayAccountId === null || body.razorpayAccountId === '') {
            update['payoutInfo.razorpayAccountId'] = '';
        } else if (typeof body.razorpayAccountId === 'string') {
            update['payoutInfo.razorpayAccountId'] = body.razorpayAccountId.trim();
        } else {
            errors.razorpayAccountId = 'Razorpay account id must be a string';
        }
    }

    if (body.verificationStatus && allowedVerificationStatuses.includes(body.verificationStatus)) {
        update['payoutInfo.verificationStatus'] = body.verificationStatus;
    } else {
        update['payoutInfo.verificationStatus'] = 'pending';
    }

    update['payoutInfo.updatedAt'] = new Date();

    if (Object.keys(errors).length > 0) {
        const error = new Error('VALIDATION_FAILED');
        (error as any).details = errors;
        throw error;
    }

    return update;
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const document = await db.collection('users').findOne(
            { _id: new ObjectId(user._id) },
            {
                projection: {
                    payoutInfo: 1
                }
            }
        );

        if (!document) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const payoutInfo = document.payoutInfo || {};

        return NextResponse.json({
            success: true,
            payout: {
                method: payoutInfo.method || 'upi',
                upiId: payoutInfo.upiId || '',
                bank: payoutInfo.bank || null,
                taxId: payoutInfo.taxId || '',
                razorpayAccountId: payoutInfo.razorpayAccountId || '',
                verificationStatus: payoutInfo.verificationStatus || 'pending',
                updatedAt: payoutInfo.updatedAt || null
            }
        });
    } catch (error) {
        console.error('Creator payout fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load payout information',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const body = await request.json();
        const update = sanitizePayoutPayload(body);

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(user._id) },
            { $set: update },
            { returnDocument: 'after', projection: { payoutInfo: 1 } }
        );

        if (!result.value) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const payoutInfo = result.value.payoutInfo || {};

        return NextResponse.json({
            success: true,
            payout: {
                method: payoutInfo.method || 'upi',
                upiId: payoutInfo.upiId || '',
                bank: payoutInfo.bank || null,
                taxId: payoutInfo.taxId || '',
                razorpayAccountId: payoutInfo.razorpayAccountId || '',
                verificationStatus: payoutInfo.verificationStatus || 'pending',
                updatedAt: payoutInfo.updatedAt || null
            }
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'VALIDATION_FAILED') {
            return NextResponse.json(
                { error: 'Validation failed', details: (error as any).details },
                { status: 400 }
            );
        }

        console.error('Creator payout update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update payout information',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

