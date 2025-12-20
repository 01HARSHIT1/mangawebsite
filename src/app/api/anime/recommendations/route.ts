import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { animeRecommendationEngine } from '@/lib/ai-anime-recommendations';
import { ObjectId } from 'mongodb';

// Get personalized recommendations using AI engine
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const userId = token ? verifyToken(token)?.userId : null;

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const excludeWatched = searchParams.get('excludeWatched') !== 'false';

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let recommendations = [];

        if (userId) {
            // Check cache first
            const cached = await db.collection('anime_recommendations_cache')
                .findOne({ 
                    userId,
                    expiresAt: { $gt: new Date() }
                });

            if (cached && cached.recommendations) {
                recommendations = cached.recommendations.slice(0, limit);
            } else {
                // Use AI recommendation engine
                const aiRecommendations = await animeRecommendationEngine.generateRecommendations(
                    userId,
                    limit * 2, // Get more to filter
                    excludeWatched
                );

                // Convert to API format
                recommendations = aiRecommendations.map(rec => ({
                    seriesId: rec.seriesId,
                    score: rec.score,
                    reason: rec.reasons.join('; '),
                    confidence: rec.confidence,
                    category: rec.category
                }));

                // Cache recommendations
                await db.collection('anime_recommendations_cache').updateOne(
                    { userId },
                    {
                        $set: {
                            recommendations: recommendations.slice(0, limit),
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
                confidence: 0.8,
                category: 'trending'
            }));
        }

        // Fetch full series data
        const seriesIds = recommendations.map((r: any) => {
            try {
                return new ObjectId(r.seriesId);
            } catch {
                return null;
            }
        }).filter(Boolean) as ObjectId[];

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
                        bannerImage: seriesData.bannerImage,
                        rating: seriesData.rating,
                        genres: seriesData.genres,
                        tags: seriesData.tags,
                        year: seriesData.year,
                        status: seriesData.status,
                        episodeCount: seriesData.episodeCount,
                        description: seriesData.description,
                    },
                };
            })
            .filter(Boolean);

        return NextResponse.json({ 
            recommendations: recommendationsWithData,
            total: recommendationsWithData.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}

