import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { AIRecommendationEngine } from '@/lib/ai-recommendations';
import { DEFAULT_AI_PREFERENCES } from '@/lib/ai-features-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Get personalized manga recommendations
export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = auth.replace('Bearer ', '');
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection('users');
        const manga = db.collection('manga');
        // Get user's reading history and preferences
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const readingHistory = user.readingHistory || [];
        const bookmarks = user.bookmarks || [];
        const likes = user.likes || [];
        
        // Get AI preferences
        const aiPreferences = user.aiPreferences || DEFAULT_AI_PREFERENCES;
        const useSmartRecommendations = aiPreferences.smartRecommendations ?? true;
        const excludeDisliked = aiPreferences.excludeDislikedManga ?? true;
        
        // Get user feedback (disliked, discontinued, not interested)
        const dislikedManga = (user.dislikedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        const discontinuedManga = (user.discontinuedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        const notInterestedManga = (user.notInterestedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        const excludedMangaIds = new Set([
            ...dislikedManga,
            ...discontinuedManga,
            ...notInterestedManga
        ]);
        
        // Extract genres from user's reading history
        const userGenres = new Set<string>();
        const readMangaIds = new Set<string>();
        // Get genres from reading history
        for (const entry of readingHistory) {
            if (entry.mangaId) {
                readMangaIds.add(entry.mangaId);
            }
        }
        // Get genres from bookmarks and likes
        for (const mangaId of [...bookmarks, ...likes]) {
            const id = typeof mangaId === 'string' ? mangaId : mangaId.mangaId || mangaId;
            readMangaIds.add(id);
        }
        // Get manga details to extract genres
        if (readMangaIds.size > 0) {
            const readManga = await manga
                .find({ _id: { $in: Array.from(readMangaIds).map(id => new ObjectId(id)) } })
                .project({ genres: 1 })
                .toArray();
            readManga.forEach(m => {
                if (m.genres) {
                    m.genres.forEach((genre: string) => userGenres.add(genre));
                }
            });
        }
        // Use AI recommendation engine if enabled
        if (useSmartRecommendations && readMangaIds.size > 0) {
            try {
                const aiEngine = new AIRecommendationEngine();
                const aiRecs = await aiEngine.generateRecommendations(
                    userId,
                    20, // Get more recommendations to filter
                    true // Exclude already read
                );

                // Convert AI recommendations to manga IDs
                const aiMangaIds = aiRecs.map(rec => new ObjectId(rec.mangaId));
                
                // Fetch full manga data
                const aiManga = await manga
                    .find({ _id: { $in: aiMangaIds } })
                    .project({
                        _id: 1,
                        title: 1,
                        description: 1,
                        coverImage: 1,
                        genres: 1,
                        tags: 1,
                        status: 1,
                        rating: 1,
                        views: 1,
                        likes: 1,
                        chapters: 1,
                        author: 1,
                        year: 1,
                    })
                    .toArray();

                // Sort by AI recommendation score
                const sortedManga = aiManga.sort((a, b) => {
                    const scoreA = aiRecs.find(r => r.mangaId === a._id.toString())?.score || 0;
                    const scoreB = aiRecs.find(r => r.mangaId === b._id.toString())?.score || 0;
                    return scoreB - scoreA;
                });

                // Filter out disliked manga if enabled
                let filteredManga = sortedManga;
                if (excludeDisliked && excludedMangaIds.size > 0) {
                    filteredManga = sortedManga.filter(m => 
                        !excludedMangaIds.has(m._id.toString())
                    );
                }

                // Also filter out already read
                const finalFiltered = filteredManga.filter(m => 
                    !readMangaIds.has(m._id.toString())
                );

                return NextResponse.json({ 
                    manga: finalFiltered.slice(0, 12),
                    source: 'ai-engine'
                });
            } catch (aiError) {
                console.error('AI recommendation error, falling back to basic:', aiError);
                // Fall through to basic recommendations
            }
        }

        // Basic recommendation system (fallback or if AI disabled)
        // If no reading history, return trending manga
        if (userGenres.size === 0) {
            const excludeIds = excludeDisliked && excludedMangaIds.size > 0 
                ? Array.from(excludedMangaIds).map(id => new ObjectId(id))
                : [];
            
            const trendingManga = await manga
                .find(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
                .sort({ views: -1 })
                .limit(12)
                .project({
                    _id: 1,
                    title: 1,
                    description: 1,
                    coverImage: 1,
                    genres: 1,
                    status: 1,
                    rating: 1,
                    views: 1,
                    likes: 1,
                    chapters: 1,
                    author: 1,
                    year: 1,
                })
                .toArray();
            return NextResponse.json({ manga: trendingManga, source: 'trending' });
        }
        
        // Get personalized recommendations based on user's preferred genres
        const userGenreArray = Array.from(userGenres);
        const excludeIds = [
            ...Array.from(readMangaIds).map(id => new ObjectId(id)),
            ...(excludeDisliked && excludedMangaIds.size > 0 
                ? Array.from(excludedMangaIds).map(id => new ObjectId(id))
                : [])
        ];
        
        // Find manga with similar genres that user hasn't read
        const recommendations = await manga
            .aggregate([
                {
                    $match: {
                        _id: { $nin: excludeIds },
                        genres: { $in: userGenreArray },
                    },
                },
                {
                    $addFields: {
                        genreMatchCount: {
                            $size: { $setIntersection: ['$genres', userGenreArray] },
                        },
                    },
                },
                { $sort: { genreMatchCount: -1, rating: -1, views: -1 } },
                { $limit: 12 },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        coverImage: 1,
                        genres: 1,
                        status: 1,
                        rating: 1,
                        views: 1,
                        likes: 1,
                        chapters: 1,
                        author: 1,
                        year: 1,
                    },
                },
            ])
            .toArray();
        // If not enough recommendations, add some popular manga from user's genres
        let finalRecommendations = recommendations;
        if (recommendations.length < 12) {
            const additionalManga = await manga
                .find({
                    _id: { $nin: excludeIds },
                    genres: { $in: userGenreArray },
                })
                .sort({ rating: -1 })
                .limit(12 - recommendations.length)
                .project({
                    _id: 1,
                    title: 1,
                    description: 1,
                    coverImage: 1,
                    genres: 1,
                    status: 1,
                    rating: 1,
                    views: 1,
                    likes: 1,
                    chapters: 1,
                    author: 1,
                    year: 1,
                })
                .toArray();
            finalRecommendations = recommendations.concat(additionalManga);
        }
        return NextResponse.json({ manga: finalRecommendations, source: 'genre-based' });
    } catch (error) {
        console.error('Error getting personalized recommendations:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 