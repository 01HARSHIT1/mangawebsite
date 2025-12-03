import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Get user's watch history
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get watch history for user
        const watchHistory = await db.collection('anime_watch_history')
            .find({ userId: payload.userId })
            .sort({ lastWatchedAt: -1 })
            .limit(50)
            .toArray();

        // Get unique series with latest episode watched
        const seriesMap = new Map();
        watchHistory.forEach((entry: any) => {
            if (!seriesMap.has(entry.seriesId) || 
                new Date(entry.lastWatchedAt) > new Date(seriesMap.get(entry.seriesId).lastWatchedAt)) {
                seriesMap.set(entry.seriesId, entry);
            }
        });

        return NextResponse.json({ 
            watchHistory: Array.from(seriesMap.values()),
            total: watchHistory.length 
        });
    } catch (error) {
        console.error('Error fetching watch history:', error);
        return NextResponse.json({ error: 'Failed to fetch watch history' }, { status: 500 });
    }
}

// Add or update watch history
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { episodeId, seriesId, lastPosition, watchedDuration, completed, quality, device } = body;

        if (!episodeId || !seriesId) {
            return NextResponse.json({ error: 'Episode ID and Series ID are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Upsert watch history
        const now = new Date();
        await db.collection('anime_watch_history').updateOne(
            {
                userId: payload.userId,
                episodeId: episodeId,
            },
            {
                $set: {
                    seriesId,
                    lastPosition: lastPosition || 0,
                    watchedDuration: watchedDuration || 0,
                    completed: completed || false,
                    quality: quality || 'auto',
                    device: device || 'web',
                    lastWatchedAt: now,
                    updatedAt: now,
                },
                $setOnInsert: {
                    userId: payload.userId,
                    episodeId,
                    createdAt: now,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Watch history updated' });
    } catch (error) {
        console.error('Error updating watch history:', error);
        return NextResponse.json({ error: 'Failed to update watch history' }, { status: 500 });
    }
}

