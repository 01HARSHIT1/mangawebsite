import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Get detailed analytics for a creator's anime series
export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const period = searchParams.get('period') || '30'; // days: 7, 30, 90, all

        // Get creator's anime series
        const query: any = {
            $or: [
                { creatorId: user._id },
                { uploaderId: user._id.toString() }
            ]
        };

        if (seriesId) {
            query._id = new ObjectId(seriesId);
        }

        const animeSeries = await db.collection('anime_series')
            .find(query)
            .toArray();

        const analytics = await Promise.all(
            animeSeries.map(async (series) => {
                const seriesIdStr = series._id.toString();

                // Calculate date range for analytics
                const now = new Date();
                let startDate: Date;
                if (period === 'all') {
                    startDate = new Date(0); // Beginning of time
                } else {
                    const days = parseInt(period, 10);
                    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                }

                // Get episodes for this series
                const episodes = await db.collection('anime_episodes')
                    .find({ seriesId: seriesIdStr })
                    .toArray();

                // Watch history analytics
                const watchHistory = await db.collection('anime_watch_history')
                    .find({
                        seriesId: seriesIdStr,
                        lastWatchedAt: { $gte: startDate }
                    })
                    .toArray();

                // Playback events analytics
                const playbackEvents = await db.collection('anime_playback_events')
                    .find({
                        seriesId: seriesIdStr,
                        timestamp: { $gte: startDate }
                    })
                    .toArray();

                // Calculate metrics
                const totalViews = watchHistory.length;
                const uniqueViewers = new Set(watchHistory.map((wh: any) => wh.userId?.toString())).size;
                const totalWatchTime = watchHistory.reduce((sum: number, wh: any) => sum + (wh.watchedDuration || 0), 0);
                const completedViews = watchHistory.filter((wh: any) => wh.completed).length;
                const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

                // Engagement metrics
                const likes = series.likes || 0;
                const ratings = await db.collection('anime_ratings')
                    .find({ seriesId: seriesIdStr })
                    .toArray();
                const averageRating = ratings.length > 0
                    ? ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length
                    : 0;
                const ratingCount = ratings.length;

                // Comments analytics
                const comments = await db.collection('anime_comments')
                    .find({ seriesId: seriesIdStr })
                    .toArray();
                const commentCount = comments.length;

                // Episode-specific analytics
                const episodeAnalytics = await Promise.all(
                    episodes.map(async (episode: any) => {
                        const episodeIdStr = episode._id.toString();
                        const episodeWatchHistory = watchHistory.filter((wh: any) => wh.episodeId === episodeIdStr);
                        const episodeViews = episodeWatchHistory.length;
                        const episodeUniqueViewers = new Set(episodeWatchHistory.map((wh: any) => wh.userId?.toString())).size;
                        const episodeWatchTime = episodeWatchHistory.reduce((sum: number, wh: any) => sum + (wh.watchedDuration || 0), 0);
                        const episodeCompleted = episodeWatchHistory.filter((wh: any) => wh.completed).length;

                        return {
                            episodeId: episodeIdStr,
                            episodeNumber: episode.episodeNumber,
                            title: episode.title,
                            views: episodeViews,
                            uniqueViewers: episodeUniqueViewers,
                            watchTime: episodeWatchTime,
                            completed: episodeCompleted,
                            completionRate: episodeViews > 0 ? (episodeCompleted / episodeViews) * 100 : 0,
                        };
                    })
                );

                // Time-based analytics (daily views for the period)
                const dailyViews = new Map<string, number>();
                watchHistory.forEach((wh: any) => {
                    const date = new Date(wh.lastWatchedAt).toISOString().split('T')[0];
                    dailyViews.set(date, (dailyViews.get(date) || 0) + 1);
                });

                const dailyAnalytics = Array.from(dailyViews.entries())
                    .map(([date, views]) => ({ date, views }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                // Geographic analytics (if region data available)
                const regionMap = new Map<string, number>();
                playbackEvents.forEach((event: any) => {
                    if (event.region) {
                        regionMap.set(event.region, (regionMap.get(event.region) || 0) + 1);
                    }
                });

                const topRegions = Array.from(regionMap.entries())
                    .map(([region, count]) => ({ region, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                return {
                    seriesId: seriesIdStr,
                    title: series.title,
                    coverImage: series.coverImage,
                    totalEpisodes: episodes.length,
                    period,
                    overview: {
                        totalViews,
                        uniqueViewers,
                        totalWatchTime, // in seconds
                        averageWatchTime: totalViews > 0 ? totalWatchTime / totalViews : 0,
                        completedViews,
                        completionRate: parseFloat(completionRate.toFixed(2)),
                        likes,
                        averageRating: parseFloat(averageRating.toFixed(2)),
                        ratingCount,
                        commentCount,
                    },
                    episodeAnalytics,
                    dailyAnalytics,
                    topRegions,
                    createdAt: series.createdAt,
                    updatedAt: series.updatedAt,
                };
            })
        );

        return NextResponse.json({
            analytics: seriesId ? analytics[0] : analytics,
            period,
        });
    } catch (error) {
        console.error('Error fetching creator analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
