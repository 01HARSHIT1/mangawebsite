import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper function to get user from token
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
        console.error('Error verifying token:', err);
        return null;
    }
}

// POST - Record a donation
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, message, paymentId, recipientId, type, mangaId, mangaTitle, metadata } = body;

        if (!amount || amount < 1) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const targetRecipientId = recipientId || user._id.toString();

        // Create donation record
        const allowedTypes = new Set(['coffee', 'creator-tip', 'subscription', 'coin-topup']);
        const donationType =
            typeof type === 'string' && allowedTypes.has(type) ? type : 'coffee';

        const donationDoc: Record<string, any> = {
            donorId: user._id.toString(),
            donorUsername: user.username,
            donorEmail: user.email,
            recipientId: targetRecipientId,
            amount: amount,
            message: message || '',
            paymentId: paymentId || null,
            type: donationType,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (mangaId) {
            donationDoc.mangaId = mangaId;
        }
        if (mangaTitle) {
            donationDoc.mangaTitle = mangaTitle;
        }
        if (metadata && typeof metadata === 'object') {
            donationDoc.metadata = metadata;
        }

        const result = await db.collection('donations').insertOne(donationDoc);

        console.log('✅ Donation recorded:', {
            donationId: result.insertedId.toString(),
            donorId: user._id.toString(),
            recipientId: targetRecipientId,
            amount: amount,
            message: message
        });

        return NextResponse.json({ 
            success: true, 
            donationId: result.insertedId.toString(),
            message: 'Thank you for your support! ❤️'
        }, { status: 201 });

    } catch (error) {
        console.error('Error recording donation:', error);
        return NextResponse.json({ 
            error: 'Failed to record donation',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET - Fetch user's donation history (optional)
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();
        const view = request.nextUrl.searchParams.get('view') || 'donor';

        const query = view === 'recipient'
            ? { recipientId: user._id.toString() }
            : { donorId: user._id.toString() };

        const donations = await db.collection('donations')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

        return NextResponse.json({ 
            success: true,
            donations: donations.map(d => ({
                ...d,
                _id: d._id.toString(),
                createdAt: d.createdAt.toISOString(),
                updatedAt: d.updatedAt.toISOString()
            })),
            totalDonations,
            count: donations.length
        });

    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch donations',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

