import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Track playback events (analytics)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        let userId: string | null = null;
        
        if (token) {
            const payload = verifyToken(token);
            userId = payload?.userId || null;
        }

        const body = await request.json();
        const { 
            episodeId, 
            seriesId, 
            eventType, 
            position, 
            duration, 
            quality, 
            device = 'web',
            payload: eventPayload 
        } = body;

        if (!episodeId || !eventType) {
            return NextResponse.json({ error: 'Episode ID and event type are required' }, { status: 400 });
        }

        const validEventTypes = ['play', 'pause', 'seek', 'quality_change', 'subtitle_change', 'audio_change', 'complete', 'error', 'heartbeat'];
        if (!validEventTypes.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get user region (simplified)
        const userRegion = request.headers.get('x-vercel-ip-country') || 'US';

        // Insert playback event
        await db.collection('anime_playback_events').insertOne({
            userId: userId || null,
            episodeId,
            seriesId: seriesId || null,
            eventType,
            timestamp: new Date(),
            position: position || null,
            duration: duration || null,
            quality: quality || null,
            device,
            region: userRegion,
            payload: eventPayload || {},
        });

        // Update watch history for play/pause/complete events
        if (userId && ['play', 'pause', 'complete'].includes(eventType)) {
            const now = new Date();
            await db.collection('anime_watch_history').updateOne(
                {
                    userId,
                    episodeId,
                },
                {
                    $set: {
                        seriesId: seriesId || null,
                        lastPosition: position || 0,
                        watchedDuration: position || 0,
                        completed: eventType === 'complete',
                        quality: quality || 'auto',
                        device,
                        lastWatchedAt: now,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        userId,
                        episodeId,
                        createdAt: now,
                    },
                },
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking playback event:', error);
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}

