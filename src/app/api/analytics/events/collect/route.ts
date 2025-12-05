import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

/**
 * Analytics & Event Collector Service
 * Collects player events for analytics and recommendation training
 * In production, would stream to Kafka/Kinesis for real-time processing
 */

export const dynamic = 'force-dynamic';

interface PlaybackEvent {
    eventType: 'play' | 'pause' | 'seek' | 'quality_change' | 'subtitle_change' | 
               'audio_change' | 'complete' | 'error' | 'heartbeat' | 'buffering' | 'resume';
    episodeId: string;
    seriesId?: string;
    timestamp: number;
    position?: number; // Current playback position in seconds
    duration?: number; // Total video duration
    quality?: string;
    device?: string;
    browser?: string;
    region?: string;
    payload?: Record<string, any>;
}

// POST /api/analytics/events/collect - Collect player events (batched)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        let userId: string | null = null;

        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
            }
        }

        const body = await request.json();
        const events: PlaybackEvent[] = Array.isArray(body.events) ? body.events : [body];

        if (events.length === 0) {
            return NextResponse.json(
                { error: 'No events provided' },
                { status: 400 }
            );
        }

        // Validate events
        for (const event of events) {
            if (!event.eventType || !event.episodeId) {
                return NextResponse.json(
                    { error: 'Invalid event: eventType and episodeId required' },
                    { status: 400 }
                );
            }
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get user region
        const userRegion = request.headers.get('x-vercel-ip-country') || 
                          request.headers.get('cf-ipcountry') || 
                          'US';

        // Prepare events for insertion
        const eventsToInsert = events.map(event => ({
            userId: userId || null,
            episodeId: event.episodeId,
            seriesId: event.seriesId || null,
            eventType: event.eventType,
            timestamp: new Date(event.timestamp || Date.now()),
            position: event.position || null,
            duration: event.duration || null,
            quality: event.quality || null,
            device: event.device || 'web',
            browser: event.browser || request.headers.get('user-agent') || null,
            region: event.region || userRegion,
            ipAddress: request.headers.get('x-forwarded-for') || null,
            payload: event.payload || {},
            createdAt: new Date(),
        }));

        // Insert events
        await db.collection('anime_playback_events').insertMany(eventsToInsert);

        // Update watch history for play/pause/complete events
        if (userId) {
            for (const event of events) {
                if (['play', 'pause', 'complete', 'heartbeat'].includes(event.eventType) && event.position) {
                    await updateWatchHistory(
                        db,
                        userId,
                        event.episodeId,
                        event.seriesId || null,
                        event.position,
                        event.duration || 0,
                        event.eventType === 'complete'
                    );
                }
            }
        }

        // In production, also send to Kafka/Kinesis for real-time processing
        // await sendToKafka(eventsToInsert);

        return NextResponse.json({
            success: true,
            eventsProcessed: events.length,
        });
    } catch (error: any) {
        console.error('Event collection error:', error);
        return NextResponse.json(
            { error: 'Failed to collect events', details: error.message },
            { status: 500 }
        );
    }
}

async function updateWatchHistory(
    db: any,
    userId: string,
    episodeId: string,
    seriesId: string | null,
    position: number,
    duration: number,
    completed: boolean
) {
    try {
        const watchedPercentage = duration > 0 ? (position / duration) * 100 : 0;

        await db.collection('anime_watch_history').updateOne(
            {
                userId,
                episodeId,
            },
            {
                $set: {
                    userId,
                    episodeId,
                    seriesId: seriesId || null,
                    lastPosition: position,
                    watchedDuration: position,
                    completed: completed || watchedPercentage >= 90,
                    lastWatchedAt: new Date(),
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating watch history:', error);
    }
}



