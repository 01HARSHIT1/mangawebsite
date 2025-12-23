import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's anime series
        const animeSeries = await db.collection('anime_series')
            .find({ 
                $or: [
                    { creatorId: user._id },
                    { uploaderId: user._id.toString() }
                ]
            })
            .sort({ createdAt: -1 })
            .project({ _id: 1, title: 1, creator: 1, createdAt: 1 })
            .toArray();

        return NextResponse.json({
            series: animeSeries.map(s => ({
                _id: s._id.toString(),
                title: s.title,
                creator: s.creator,
                createdAt: s.createdAt
            }))
        });
    } catch (error: any) {
        console.error('Error fetching creator anime series:', error);
        return NextResponse.json(
            { error: 'Failed to fetch series', details: error.message },
            { status: 500 }
        );
    }
}

