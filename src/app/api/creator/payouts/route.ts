import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret-key';

    try {
        const decoded = jwt.verify(token, secret) as any;
        const userId = decoded.userId || decoded.id;

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        return user;
    } catch (err) {
        return null;
    }
}

// POST - Request a payout
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user || !user.isCreator) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await request.json();

        if (!amount || amount < 100) {
            return NextResponse.json({ error: 'Minimum payout amount is ₹100' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Calculate available balance
        const donations = await db.collection('donations')
            .find({ recipientId: user._id.toString() })
            .toArray();

        const totalBalance = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

        // Check existing payouts
        const payouts = await db.collection('payouts')
            .find({ creatorId: user._id.toString() })
            .toArray();

        const totalPayouts = payouts
            .filter(p => p.status !== 'failed')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const availableBalance = totalBalance - totalPayouts;

        if (amount > availableBalance) {
            return NextResponse.json({ 
                error: 'Insufficient balance',
                availableBalance 
            }, { status: 400 });
        }

        // Create payout request
        const payoutDoc = {
            creatorId: user._id.toString(),
            username: user.username,
            email: user.email,
            amount: amount,
            currency: 'INR',
            status: 'requested',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('payouts').insertOne(payoutDoc);

        console.log('✅ Payout request created:', {
            payoutId: result.insertedId.toString(),
            creatorId: user._id.toString(),
            amount: amount
        });

        // TODO: Integrate with Razorpay Payouts API to actually process the payout
        // For now, it's just recorded in database

        return NextResponse.json({ 
            success: true,
            payoutId: result.insertedId.toString(),
            message: 'Payout request submitted successfully. Processing time: 3-5 business days.'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating payout:', error);
        return NextResponse.json({ 
            error: 'Failed to create payout request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET - Fetch payout history
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user || !user.isCreator) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();

        const payouts = await db.collection('payouts')
            .find({ creatorId: user._id.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ 
            success: true,
            payouts: payouts.map(p => ({
                ...p,
                _id: p._id.toString(),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                completedAt: p.completedAt ? p.completedAt.toISOString() : null
            }))
        });

    } catch (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch payouts',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

