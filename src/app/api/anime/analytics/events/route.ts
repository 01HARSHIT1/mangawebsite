import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// Comprehensive analytics event collection for anime playback
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();

        // Support both single event and batch events
        const events = Array.isArray(body) ? body : [body];

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const now = new Date();
        const processedEvents = [];

        for (const event of events) {
            const {
                episodeId,
                seriesId,
                eventType,
                position,
                duration,
                quality,
                device,
                playerVersion,
                bandwidth,
                errorCode,
                errorMessage,
                metadata
            } = event;

            if (!episodeId || !seriesId || !eventType) {
                continue; // Skip invalid events
            }

            const analyticsEvent = {
                userId: user._id.toString(),
                episodeId,
                seriesId,
                eventType, // play, pause, seek, complete, heartbeat, quality_change, error, etc.
                position: position || 0,
                duration: duration || 0,
                quality: quality || 'auto',
                device: device || 'web',
                playerVersion: playerVersion || '1.0',
                bandwidth: bandwidth || null,
                errorCode: errorCode || null,
                errorMessage: errorMessage || null,
                metadata: metadata || {},
                timestamp: now,
                createdAt: now
            };

            processedEvents.push(analyticsEvent);
        }

        // Batch insert events
        if (processedEvents.length > 0) {
            await db.collection('anime_playback_events').insertMany(processedEvents);

            // Update watch history for play/pause/complete events
            const watchHistoryEvents = processedEvents.filter(
                e => ['play', 'pause', 'complete'].includes(e.eventType)
            );

            for (const event of watchHistoryEvents) {
                if (event.eventType === 'complete') {
                    await db.collection('anime_watch_history').updateOne(
                        {
                            userId: event.userId,
                            episodeId: event.episodeId
                        },
                        {
                            $set: {
                                seriesId: event.seriesId,
                                lastPosition: event.duration,
                                watchedDuration: event.duration,
                                completed: true,
                                quality: event.quality,
                                device: event.device,
                                lastWatchedAt: now,
                                updatedAt: now
                            },
                            $setOnInsert: {
                                userId: event.userId,
                                episodeId: event.episodeId,
                                createdAt: now
                            }
                        },
                        { upsert: true }
                    );
                } else if (event.eventType === 'pause') {
                    await db.collection('anime_watch_history').updateOne(
                        {
                            userId: event.userId,
                            episodeId: event.episodeId
                        },
                        {
                            $set: {
                                seriesId: event.seriesId,
                                lastPosition: event.position,
                                watchedDuration: event.position,
                                completed: false,
                                quality: event.quality,
                                device: event.device,
                                lastWatchedAt: now,
                                updatedAt: now
                            },
                            $setOnInsert: {
                                userId: event.userId,
                                episodeId: event.episodeId,
                                createdAt: now
                            }
                        },
                        { upsert: true }
                    );
                }
            }

            // Update series statistics
            const uniqueSeriesIds = [...new Set(processedEvents.map(e => e.seriesId))];
            for (const seriesId of uniqueSeriesIds) {
                const playEvents = processedEvents.filter(
                    e => e.seriesId === seriesId && e.eventType === 'play'
                );
                if (playEvents.length > 0) {
                    await db.collection('anime_series').updateOne(
                        { _id: seriesId },
                        { $inc: { views: 1 } }
                    );
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedEvents.length,
            message: 'Events recorded successfully'
        });
    } catch (error: any) {
        console.error('Error recording analytics events:', error);
        return NextResponse.json(
            { error: 'Failed to record events', details: error.message },
            { status: 500 }
        );
    }
}

// Get analytics data for creator/admin
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        
        // Only creators and admins can view analytics
        if (user.role !== 'creator' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const episodeId = searchParams.get('episodeId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const eventType = searchParams.get('eventType');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        
        if (seriesId) {
            query.seriesId = seriesId;
        }
        
        if (episodeId) {
            query.episodeId = episodeId;
        }
        
        if (eventType) {
            query.eventType = eventType;
        }

        // Date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        } else {
            // Default to last 30 days
            query.timestamp = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        // If creator, only show their own series
        if (user.role === 'creator') {
            const creatorSeries = await db.collection('anime_series')
                .find({ creatorId: user._id.toString() })
                .toArray();
            const creatorSeriesIds = creatorSeries.map((s: any) => s._id.toString());
            query.seriesId = { $in: creatorSeriesIds };
        }

        // Get events
        const events = await db.collection('anime_playback_events')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(1000)
            .toArray();

        // Aggregate statistics
        const stats = {
            totalEvents: events.length,
            playEvents: events.filter((e: any) => e.eventType === 'play').length,
            pauseEvents: events.filter((e: any) => e.eventType === 'pause').length,
            completeEvents: events.filter((e: any) => e.eventType === 'complete').length,
            seekEvents: events.filter((e: any) => e.eventType === 'seek').length,
            errorEvents: events.filter((e: any) => e.eventType === 'error').length,
            uniqueUsers: new Set(events.map((e: any) => e.userId)).size,
            uniqueEpisodes: new Set(events.map((e: any) => e.episodeId)).size,
            averageWatchTime: 0,
            qualityDistribution: {} as Record<string, number>,
            deviceDistribution: {} as Record<string, number>
        };

        // Calculate average watch time from complete events
        const completeEvents = events.filter((e: any) => e.eventType === 'complete');
        if (completeEvents.length > 0) {
            const totalWatchTime = completeEvents.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
            stats.averageWatchTime = totalWatchTime / completeEvents.length;
        }

        // Quality distribution
        events.forEach((e: any) => {
            const quality = e.quality || 'unknown';
            stats.qualityDistribution[quality] = (stats.qualityDistribution[quality] || 0) + 1;
        });

        // Device distribution
        events.forEach((e: any) => {
            const device = e.device || 'unknown';
            stats.deviceDistribution[device] = (stats.deviceDistribution[device] || 0) + 1;
        });

        return NextResponse.json({
            events: events.slice(0, 100), // Return first 100 events
            stats,
            total: events.length
        });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics', details: error.message },
            { status: 500 }
        );
    }
}

