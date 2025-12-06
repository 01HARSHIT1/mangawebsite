import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Creator Payout Requests API
 * Handles payout requests and payout history
 */

export const dynamic = 'force-dynamic';

// POST /api/creators/payout-requests - Request a payout
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'creator' && payload.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Creator access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { amount, bankAccountId, notes } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator profile
        const creator = await db.collection('creators').findOne({ 
            userId: payload.userId 
        });

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            );
        }

        // Check KYC status
        if (creator.kycStatus !== 'verified') {
            return NextResponse.json(
                { error: 'KYC verification required for payouts' },
                { status: 403 }
            );
        }

        // Get pending earnings
        const pendingEarnings = await db.collection('creator_earnings')
            .find({ 
                creatorId: creator._id.toString(),
                status: 'pending',
            })
            .toArray();

        const availableBalance = pendingEarnings.reduce(
            (sum: number, e: any) => sum + (e.amount || 0), 
            0
        );

        if (amount > availableBalance) {
            return NextResponse.json(
                { 
                    error: 'Insufficient balance',
                    availableBalance,
                    requested: amount,
                },
                { status: 400 }
            );
        }

        // Check minimum payout threshold (e.g., 500 INR)
        const MIN_PAYOUT = 500;
        if (amount < MIN_PAYOUT) {
            return NextResponse.json(
                { 
                    error: `Minimum payout amount is ${MIN_PAYOUT} INR`,
                    minimum: MIN_PAYOUT,
                },
                { status: 400 }
            );
        }

        // Create payout request
        const payoutRequest = {
            creatorId: creator._id.toString(),
            userId: payload.userId,
            amount,
            currency: 'INR',
            bankAccountId: bankAccountId || creator.payoutAccountId,
            status: 'pending', // 'pending' | 'processing' | 'completed' | 'failed'
            notes: notes || '',
            requestedAt: new Date(),
            processedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('payout_requests').insertOne(payoutRequest);

        // Mark earnings as processing (in production, would use a transaction)
        await db.collection('creator_earnings').updateMany(
            {
                creatorId: creator._id.toString(),
                status: 'pending',
            },
            {
                $set: {
                    status: 'processing',
                    payoutRequestId: result.insertedId.toString(),
                    updatedAt: new Date(),
                },
            },
            { limit: Math.ceil(amount / 10) } // Approximate number of earnings records
        );

        return NextResponse.json({
            success: true,
            payoutRequestId: result.insertedId.toString(),
            amount,
            status: 'pending',
            message: 'Payout request submitted. Processing will begin within 3-5 business days.',
        });
    } catch (error: any) {
        console.error('Error creating payout request:', error);
        return NextResponse.json(
            { error: 'Failed to create payout request', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/creators/payout-requests - Get payout history
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'creator' && payload.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Creator access required' },
                { status: 403 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator profile
        const creator = await db.collection('creators').findOne({ 
            userId: payload.userId 
        });

        if (!creator && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            );
        }

        const creatorId = creator?._id?.toString() || payload.userId;

        // Get payout requests
        const payouts = await db.collection('payout_requests')
            .find({ creatorId })
            .sort({ requestedAt: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            payouts: payouts.map((p: any) => ({
                id: p._id.toString(),
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                requestedAt: p.requestedAt,
                processedAt: p.processedAt,
                notes: p.notes,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching payout requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payout requests', details: error.message },
            { status: 500 }
        );
    }
}

