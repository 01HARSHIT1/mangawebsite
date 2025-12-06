import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

/**
 * Home Blocks API
 * Returns curated content blocks for the home page
 * Includes hero carousel, trending rows, personalized recommendations
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('user_id');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        let authenticatedUserId: string | null = null;
        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                authenticatedUserId = payload.userId;
            }
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const blocks: any[] = [];

        // 1. Hero Carousel (Featured/Promoted)
        const featured = await db.collection('anime_series')
            .find({ isFeatured: true })
            .sort({ rating: -1, createdAt: -1 })
            .limit(5)
            .toArray();

        if (featured.length > 0) {
            blocks.push({
                type: 'hero',
                items: featured.map((series: any) => ({
                    id: series._id.toString(),
                    contentType: 'series',
                    title: series.title,
                    poster: series.bannerImage || series.coverImage,
                    description: series.description,
                    cta: 'watch',
                    rating: series.rating,
                    year: series.year,
                })),
            });
        }

        // 2. Trending Now
        const trending = await db.collection('anime_series')
            .find({})
            .sort({ rating: -1, episodeCount: -1 })
            .limit(20)
            .toArray();

        if (trending.length > 0) {
            blocks.push({
                type: 'carousel',
                title: 'Trending Now',
                items: trending.map((series: any) => ({
                    id: series._id.toString(),
                    title: series.title,
                    poster: series.coverImage,
                    rating: series.rating,
                    episodeCount: series.episodeCount,
                })),
            });
        }

        // 3. Continue Watching (if authenticated)
        if (authenticatedUserId) {
            const watchHistory = await db.collection('anime_watch_history')
                .find({ 
                    userId: authenticatedUserId,
                    completed: false,
                })
                .sort({ lastWatchedAt: -1 })
                .limit(20)
                .toArray();

            if (watchHistory.length > 0) {
                const continueWatchingItems = await Promise.all(
                    watchHistory.map(async (history: any) => {
                        const episode = await db.collection('anime_episodes').findOne({
                            _id: history.episodeId,
                        });
                        const series = await db.collection('anime_series').findOne({
                            _id: history.seriesId,
                        });
                        return {
                            id: episode?._id.toString(),
                            seriesId: series?._id.toString(),
                            title: episode?.title,
                            seriesTitle: series?.title,
                            poster: episode?.thumbnail || series?.coverImage,
                            lastPosition: history.lastPosition,
                            duration: episode?.duration,
                            watchedPercentage: history.watchedPercentage,
                        };
                    })
                );

                blocks.push({
                    type: 'carousel',
                    title: 'Continue Watching',
                    items: continueWatchingItems.filter(Boolean),
                });
            }

            // 4. Recommended For You
            const recommendations = await db.collection('anime_recommendations_cache')
                .findOne({ 
                    userId: authenticatedUserId,
                    expiresAt: { $gt: new Date() },
                });

            if (recommendations && recommendations.recommendations) {
                const recItems = await Promise.all(
                    recommendations.recommendations.slice(0, 20).map(async (rec: any) => {
                        const series = await db.collection('anime_series').findOne({
                            _id: rec.seriesId,
                        });
                        if (series) {
                            return {
                                id: series._id.toString(),
                                title: series.title,
                                poster: series.coverImage,
                                rating: series.rating,
                                reason: rec.reason,
                            };
                        }
                        return null;
                    })
                );

                blocks.push({
                    type: 'carousel',
                    title: 'Recommended For You',
                    items: recItems.filter(Boolean),
                });
            }
        }

        // 5. New Releases
        const recent = await db.collection('anime_series')
            .find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        if (recent.length > 0) {
            blocks.push({
                type: 'carousel',
                title: 'New Releases',
                items: recent.map((series: any) => ({
                    id: series._id.toString(),
                    title: series.title,
                    poster: series.coverImage,
                    rating: series.rating,
                    year: series.year,
                })),
            });
        }

        // 6. Popular This Week
        const popular = await db.collection('anime_series')
            .find({})
            .sort({ rating: -1, episodeCount: -1 })
            .limit(20)
            .toArray();

        if (popular.length > 0) {
            blocks.push({
                type: 'carousel',
                title: 'Popular This Week',
                items: popular.map((series: any) => ({
                    id: series._id.toString(),
                    title: series.title,
                    poster: series.coverImage,
                    rating: series.rating,
                    episodeCount: series.episodeCount,
                })),
            });
        }

        // 7. Editor's Picks (curated)
        const editorsPicks = await db.collection('anime_series')
            .find({ isEditorsPick: true })
            .sort({ rating: -1 })
            .limit(20)
            .toArray();

        if (editorsPicks.length > 0) {
            blocks.push({
                type: 'carousel',
                title: "Editor's Picks",
                items: editorsPicks.map((series: any) => ({
                    id: series._id.toString(),
                    title: series.title,
                    poster: series.coverImage,
                    rating: series.rating,
                })),
            });
        }

        return NextResponse.json({ blocks });
    } catch (error: any) {
        console.error('Error fetching home blocks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch home blocks', details: error.message },
            { status: 500 }
        );
    }
}

