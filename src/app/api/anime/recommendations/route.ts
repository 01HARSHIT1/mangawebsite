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

        // Get user preferences for language-based filtering
        let userPreferences: any = null;
        if (userId) {
            const prefsDoc = await db.collection('anime_user_preferences').findOne({ userId });
            if (prefsDoc) {
                userPreferences = prefsDoc.preferences || {};
            } else {
                // Try getting from user document
                const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
                if (user?.animePreferences) {
                    userPreferences = user.animePreferences;
                }
            }
        }

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
            // Still filter by default languages from platform config if available
            const platformConfig = await db.collection('platform_config').findOne({});
            const defaultAudio = platformConfig?.defaultAudioLanguage || 'Japanese';
            const defaultSubtitle = platformConfig?.defaultSubtitleLanguage || 'English';

            const popularSeries = await db.collection('anime_series')
                .find({ 
                    rating: { $gte: 8.0 },
                    isHidden: { $ne: true },
                    isSuppressed: { $ne: true }
                })
                .sort({ rating: -1, year: -1 })
                .limit(limit * 2) // Get more to filter
                .toArray();

            // Check language availability and prioritize matching languages
            const seriesWithLanguages = await Promise.all(
                popularSeries.map(async (series: any) => {
                    const episodes = await db.collection('anime_episodes')
                        .find({ seriesId: series._id })
                        .limit(1)
                        .toArray();
                    
                    let languageScore = 0;
                    if (episodes.length > 0) {
                        const ep = episodes[0];
                        if (ep.audioTracks?.some((t: any) => 
                            t.languageCode === defaultAudio.toLowerCase().substring(0, 2) ||
                            t.language?.toLowerCase().includes(defaultAudio.toLowerCase())
                        )) {
                            languageScore += 0.2;
                        }
                        if (ep.subtitles?.some((s: any) => 
                            s.languageCode === defaultSubtitle.toLowerCase().substring(0, 2) ||
                            s.language?.toLowerCase().includes(defaultSubtitle.toLowerCase())
                        )) {
                            languageScore += 0.1;
                        }
                    }

                    return {
                        seriesId: series._id.toString(),
                        score: (series.rating || 0) + languageScore,
                        reason: 'Popular and highly rated',
                        confidence: 0.8,
                        category: 'trending'
                    };
                })
            );

            recommendations = seriesWithLanguages
                .sort((a: any, b: any) => b.score - a.score)
                .slice(0, limit);
        }

        // Fetch full series data
        const seriesIds = recommendations.map((r: any) => {
            try {
                return new ObjectId(r.seriesId);
            } catch {
                return null;
            }
        }).filter(Boolean) as ObjectId[];

        // Build filter for language-based recommendations
        const seriesFilter: any = { _id: { $in: seriesIds } };
        
        // Filter by preferred audio language if specified
        if (userPreferences?.defaultAudioLanguage) {
            // We'll filter episodes later, but for now just get all series
            // The scoring will prioritize series with matching audio tracks
        }

        const series = await db.collection('anime_series')
            .find(seriesFilter)
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

