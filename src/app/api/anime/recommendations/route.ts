import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Get personalized recommendations
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const userId = token ? verifyToken(token)?.userId : null;

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let recommendations = [];

        if (userId) {
            // Personalized recommendations for logged-in users
            // Check cache first
            const cached = await db.collection('anime_recommendations_cache')
                .findOne({ 
                    userId,
                    expiresAt: { $gt: new Date() }
                });

            if (cached) {
                recommendations = cached.recommendations.slice(0, limit);
            } else {
                // Generate recommendations
                // 1. Get user's watch history
                const watchHistory = await db.collection('anime_watch_history')
                    .find({ userId })
                    .toArray();

                // 2. Get user's favorites
                const favorites = await db.collection('anime_my_list')
                    .find({ userId, listType: 'favorites' })
                    .toArray();

                // 3. Content-based recommendations (based on genres of watched content)
                const watchedSeriesIds = [...new Set(watchHistory.map((h: any) => h.seriesId))];
                const favoriteSeriesIds = favorites.map((f: any) => f.seriesId);

                // Get genres from watched/favorited series
                const watchedSeries = await db.collection('anime_series')
                    .find({ _id: { $in: watchedSeriesIds } })
                    .toArray();

                const favoriteGenres = new Set<string>();
                watchedSeries.forEach((series: any) => {
                    if (series.genres) {
                        series.genres.forEach((g: string) => favoriteGenres.add(g));
                    }
                });

                // Find similar series (same genres, high rating, not already watched)
                const excludeIds = [...watchedSeriesIds, ...favoriteSeriesIds];
                const similarSeries = await db.collection('anime_series')
                    .find({
                        _id: { $nin: excludeIds },
                        genres: { $in: Array.from(favoriteGenres) },
                        rating: { $gte: 7.0 },
                    })
                    .sort({ rating: -1, year: -1 })
                    .limit(limit * 2)
                    .toArray();

                // 4. Popular/trending fallback
                const popularSeries = await db.collection('anime_series')
                    .find({
                        _id: { $nin: excludeIds },
                        rating: { $gte: 8.0 },
                    })
                    .sort({ rating: -1 })
                    .limit(limit)
                    .toArray();

                // Combine and score
                const allCandidates = [...similarSeries, ...popularSeries];
                const scored = allCandidates.map((series: any) => {
                    let score = series.rating || 0;
                    // Boost if genres match
                    const genreMatch = series.genres?.filter((g: string) => favoriteGenres.has(g)).length || 0;
                    score += genreMatch * 0.5;
                    return { seriesId: series._id.toString(), score, reason: 'Based on your preferences' };
                });

                recommendations = scored
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit)
                    .map((r: any) => ({
                        seriesId: r.seriesId,
                        score: r.score,
                        reason: r.reason,
                    }));

                // Cache recommendations
                await db.collection('anime_recommendations_cache').updateOne(
                    { userId },
                    {
                        $set: {
                            recommendations,
                            generatedAt: new Date(),
                            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                        },
                    },
                    { upsert: true }
                );
            }
        } else {
            // Non-personalized recommendations for anonymous users
            const popularSeries = await db.collection('anime_series')
                .find({ rating: { $gte: 8.0 } })
                .sort({ rating: -1, year: -1 })
                .limit(limit)
                .toArray();

            recommendations = popularSeries.map((series: any) => ({
                seriesId: series._id.toString(),
                score: series.rating || 0,
                reason: 'Popular and highly rated',
            }));
        }

        // Fetch full series data
        const seriesIds = recommendations.map((r: any) => r.seriesId);
        const series = await db.collection('anime_series')
            .find({ _id: { $in: seriesIds } })
            .toArray();

        const seriesMap = new Map(series.map((s: any) => [s._id.toString(), s]));

        const recommendationsWithData = recommendations
            .map((rec: any) => {
                const seriesData = seriesMap.get(rec.seriesId);
                if (!seriesData) return null;
                return {
                    ...rec,
                    series: {
                        _id: seriesData._id.toString(),
                        title: seriesData.title,
                        coverImage: seriesData.coverImage,
                        rating: seriesData.rating,
                        genres: seriesData.genres,
                        year: seriesData.year,
                    },
                };
            })
            .filter(Boolean);

        return NextResponse.json({ 
            recommendations: recommendationsWithData,
            total: recommendationsWithData.length 
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}

