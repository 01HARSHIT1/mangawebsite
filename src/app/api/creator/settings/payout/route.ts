import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { ensureCreatorRazorpayAccount, CreatorDocument } from '@/lib/razorpay/payouts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PayoutMethod = 'razorpay' | 'upi' | 'bank';

function sanitizePayoutPayload(body: any) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid payload');
    }

    const errors: Record<string, string> = {};
    const update: any = {};

    const method: PayoutMethod =
        body.method === 'bank'
            ? 'bank'
            : body.method === 'razorpay'
            ? 'razorpay'
            : 'upi';
    update['payoutInfo.method'] = method;

    const razorpayAccountId =
        typeof body.razorpayAccountId === 'string' ? body.razorpayAccountId.trim() : '';
    const hasRazorpayAccount = Boolean(razorpayAccountId);

    if (hasRazorpayAccount) {
        update['payoutInfo.razorpayAccountId'] = razorpayAccountId;
    } else {
        update['payoutInfo.razorpayAccountId'] = '';
    }

    if (method === 'razorpay') {
        if (!razorpayAccountId) {
            errors.razorpayAccountId = 'Razorpay beneficiary ID is required';
        }
        update['payoutInfo.upiId'] = null;
        update['payoutInfo.bank'] = null;
    }

    if (method === 'upi') {
        if (!hasRazorpayAccount && (!body.upiId || typeof body.upiId !== 'string')) {
            errors.upiId = 'UPI ID is required';
        }
        update['payoutInfo.upiId'] =
            typeof body.upiId === 'string' ? body.upiId.trim() : hasRazorpayAccount ? '' : null;
        update['payoutInfo.bank'] = null;
    }

    if (method === 'bank') {
        const accountHolder = typeof body.accountHolder === 'string' ? body.accountHolder.trim() : '';
        const accountNumber = typeof body.accountNumber === 'string' ? body.accountNumber.trim() : '';
        const ifsc = typeof body.ifsc === 'string' ? body.ifsc.trim().toUpperCase() : '';
        const bankName = typeof body.bankName === 'string' ? body.bankName.trim() : '';

        const bankFieldsProvided = accountHolder || accountNumber || ifsc || bankName;

        if (!hasRazorpayAccount) {
            if (!accountHolder) errors.accountHolder = 'Account holder name is required';
            if (!accountNumber) errors.accountNumber = 'Account number is required';
            if (!ifsc) errors.ifsc = 'IFSC code is required';
            if (!bankName) errors.bankName = 'Bank name is required';
        } else if (bankFieldsProvided && (!accountHolder || !accountNumber || !ifsc)) {
            errors.bank = 'Provide all bank details or leave the fields empty.';
        }

        if (!hasRazorpayAccount && (errors.accountHolder || errors.accountNumber || errors.ifsc)) {
            // bank details incomplete, keep previous state by not overwriting
        } else if (bankFieldsProvided || !hasRazorpayAccount) {
            update['payoutInfo.bank'] = {
                accountHolder,
                accountNumber,
                ifsc,
                bankName
            };
        } else {
            update['payoutInfo.bank'] = null;
        }
        update['payoutInfo.upiId'] = null;
    }

    const taxId = typeof body.taxId === 'string' ? body.taxId.trim() : '';
    if (taxId) {
        update['payoutInfo.taxId'] = taxId;
    } else {
        update['payoutInfo.taxId'] = '';
    }

    update['payoutInfo.verificationStatus'] = 'pending';
    update['payoutInfo.razorpayFundAccountId'] = '';
    update['payoutInfo.razorpayContactId'] = '';
    update['payoutInfo.razorpayAccountStatus'] = hasRazorpayAccount ? 'pending' : '';
    update['payoutInfo.lastSyncMessage'] = '';
    update['payoutInfo.lastSyncedAt'] = null;
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
                method:
                    payoutInfo.method ||
                    (payoutInfo.razorpayAccountId ? 'razorpay' : payoutInfo.upiId ? 'upi' : 'bank'),
                upiId: payoutInfo.upiId || '',
                bank: payoutInfo.bank || null,
                taxId: payoutInfo.taxId || '',
                razorpayAccountId: payoutInfo.razorpayAccountId || '',
                verificationStatus: payoutInfo.verificationStatus || 'pending',
                razorpayFundAccountId: payoutInfo.razorpayFundAccountId || '',
                razorpayContactId: payoutInfo.razorpayContactId || '',
                razorpayAccountStatus: payoutInfo.razorpayAccountStatus || '',
                lastSyncedAt: payoutInfo.lastSyncedAt || null,
                lastSyncMessage: payoutInfo.lastSyncMessage || '',
                updatedAt: payoutInfo.updatedAt || null
            },
            syncStatus: payoutInfo.verificationStatus || 'pending',
            syncMessage: payoutInfo.lastSyncMessage || ''
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

        const creatorDocument = await db.collection('users').findOne({ _id: new ObjectId(user._id) });

        if (!creatorDocument) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const syncResult = await ensureCreatorRazorpayAccount({
            creator: creatorDocument as CreatorDocument,
        });

        const syncUpdates: Record<string, unknown> = {};
        if (syncResult.payoutInfoUpdates) {
            for (const [key, value] of Object.entries(syncResult.payoutInfoUpdates)) {
                syncUpdates[`payoutInfo.${key}`] = value;
            }
        }

        if (Object.keys(syncUpdates).length > 0) {
            await db.collection('users').updateOne(
                { _id: new ObjectId(user._id) },
                { $set: syncUpdates }
            );
        }

        const refreshed = await db.collection('users').findOne(
            { _id: new ObjectId(user._id) },
            { projection: { payoutInfo: 1 } }
        );

        const payoutInfo = refreshed?.payoutInfo || {};

        return NextResponse.json({
            success: true,
            payout: {
                method:
                    payoutInfo.method ||
                    (payoutInfo.razorpayAccountId ? 'razorpay' : payoutInfo.upiId ? 'upi' : 'bank'),
                upiId: payoutInfo.upiId || '',
                bank: payoutInfo.bank || null,
                taxId: payoutInfo.taxId || '',
                razorpayAccountId: payoutInfo.razorpayAccountId || '',
                razorpayFundAccountId: payoutInfo.razorpayFundAccountId || '',
                razorpayContactId: payoutInfo.razorpayContactId || '',
                verificationStatus: payoutInfo.verificationStatus || 'pending',
                razorpayAccountStatus: payoutInfo.razorpayAccountStatus || '',
                lastSyncedAt: payoutInfo.lastSyncedAt || null,
                lastSyncMessage:
                    payoutInfo.lastSyncMessage ||
                    syncResult.message ||
                    (syncResult.status === 'verified'
                        ? 'Payout account verified successfully.'
                        : ''),
                updatedAt: payoutInfo.updatedAt || null
            },
            syncStatus: syncResult.status,
            syncMessage: syncResult.message || ''
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

