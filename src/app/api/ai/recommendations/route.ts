import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAIRecommendationEngine } from '@/lib/ai-recommendations';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const category = searchParams.get('category') || 'all';
        const excludeRead = searchParams.get('excludeRead') !== 'false';

        let userId = null;
        try {
            const user = await requireAuth(request);
            userId = user._id;
        } catch (error) {
            // Not authenticated, provide general recommendations
        }

        const aiEngine = getAIRecommendationEngine();
        
        if (userId) {
            // Get personalized recommendations
            const recommendations = await aiEngine.generateRecommendations(userId, limit, excludeRead);
            
            // Get manga details for recommendations
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            
            const enrichedRecommendations = await Promise.all(
                recommendations.map(async (rec) => {
                    try {
                        const manga = await db.collection('manga').findOne({
                            _id: rec.mangaId
                        });
                        
                        return {
                            ...rec,
                            manga: manga ? {
                                _id: manga._id,
                                title: manga.title,
                                creator: manga.creator,
                                description: manga.description,
                                genres: manga.genres,
                                coverImage: manga.coverImage,
                                rating: manga.rating,
                                views: manga.views,
                                status: manga.status
                            } : null
                        };
                    } catch (error) {
                        console.error('Error enriching recommendation:', error);
                        return {
                            ...rec,
                            manga: null
                        };
                    }
                })
            );

            // Filter out recommendations without manga data
            const validRecommendations = enrichedRecommendations.filter(rec => rec.manga !== null);

            return NextResponse.json({
                recommendations: validRecommendations,
                algorithm: 'ai-hybrid',
                personalized: true,
                userId,
                generatedAt: new Date().toISOString()
            });
        } else {
            // Return trending/popular recommendations for non-authenticated users
            try {
                const client = await clientPromise;
                const db = client.db('mangawebsite');
                
                const trendingManga = await db.collection('manga')
                    .find({})
                    .sort({ views: -1, rating: -1 })
                    .limit(limit)
                    .toArray();

                const recommendations = trendingManga.map((manga, index) => ({
                    mangaId: manga._id.toString(),
                    score: 0.9 - (index * 0.05),
                    reasons: ['Popular with readers', 'Trending now'],
                    confidence: 0.8,
                    category: 'trending' as const,
                    manga: {
                        _id: manga._id,
                        title: manga.title,
                        creator: manga.creator,
                        description: manga.description,
                        genres: manga.genres,
                        coverImage: manga.coverImage,
                        rating: manga.rating,
                        views: manga.views,
                        status: manga.status
                    }
                }));

                return NextResponse.json({
                    recommendations,
                    algorithm: 'trending',
                    personalized: false,
                    generatedAt: new Date().toISOString()
                });
            } catch (dbError) {
                // Database fallback
                const mockRecommendations = [
                    {
                        mangaId: '1',
                        score: 0.9,
                        reasons: ['Trending now', 'Highly rated'],
                        confidence: 0.8,
                        category: 'trending' as const,
                        manga: {
                            _id: '1',
                            title: 'Dragon Chronicles',
                            creator: 'Akira Yamamoto',
                            description: 'An epic fantasy adventure following a young dragon rider.',
                            genres: ['Fantasy', 'Adventure', 'Action'],
                            coverImage: '/placeholder-page-1.svg',
                            rating: 4.8,
                            views: 15420,
                            status: 'ongoing'
                        }
                    },
                    {
                        mangaId: '2',
                        score: 0.85,
                        reasons: ['Popular choice', 'Great for beginners'],
                        confidence: 0.75,
                        category: 'trending' as const,
                        manga: {
                            _id: '2',
                            title: 'Tokyo High School',
                            creator: 'Yuki Tanaka',
                            description: 'A slice-of-life story about friendship and love.',
                            genres: ['Romance', 'Slice of Life', 'Drama'],
                            coverImage: '/placeholder-page-2.svg',
                            rating: 4.6,
                            views: 8930,
                            status: 'ongoing'
                        }
                    }
                ];

                return NextResponse.json({
                    recommendations: mockRecommendations,
                    algorithm: 'fallback',
                    personalized: false,
                    generatedAt: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.error('Error generating AI recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { action, mangaId, rating, readingTime, completionRate } = await request.json();

        // Record user behavior for AI learning
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const behaviorData = {
            userId: user._id,
            mangaId,
            action,
            rating,
            readingTime,
            completionRate,
            timestamp: new Date(),
            sessionData: {
                userAgent: request.headers.get('user-agent'),
                referrer: request.headers.get('referer')
            }
        };

        await db.collection('user_behavior').insertOne(behaviorData);

        // Update AI model with new behavior data
        // In production, this would trigger model retraining
        console.log(`📊 Recorded behavior: ${user.username} ${action} ${mangaId}`);

        return NextResponse.json({
            success: true,
            message: 'Behavior recorded for AI learning'
        });

    } catch (error) {
        console.error('Error recording user behavior:', error);
        return NextResponse.json(
            { error: 'Failed to record behavior' },
            { status: 500 }
        );
    }
}
