import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch payment history
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Fetch coin purchases and donations
        const [coinPurchases, donations] = await Promise.all([
            db.collection('coin_purchases')
                .find({})
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray(),
            db.collection('donations')
                .find({})
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray()
        ]);

        const payments = [
            ...coinPurchases.map(p => ({
                ...p,
                _id: p._id.toString(),
                type: 'coin_purchase',
                amount: p.amount,
                userId: p.userId?.toString(),
                createdAt: p.createdAt
            })),
            ...donations.map(d => ({
                ...d,
                _id: d._id.toString(),
                type: 'donation',
                amount: d.amount,
                userId: d.userId?.toString(),
                recipientId: d.recipientId?.toString(),
                createdAt: d.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const total = await Promise.all([
            db.collection('coin_purchases').countDocuments({}),
            db.collection('donations').countDocuments({})
        ]).then(([a, b]) => a + b);

        return NextResponse.json({
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Failed to fetch payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

