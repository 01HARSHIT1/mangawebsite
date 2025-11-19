import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDeepSemanticSearchEngine } from '@/lib/semantic-search-v2';
import { DEFAULT_AI_PREFERENCES } from '@/lib/ai-features-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// This API route is server-side only, using native Node.js modules

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Semantic search for manga
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, limit = 20 } = body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get user preferences if authenticated
        let userPreferences: any = {};
        const auth = request.headers.get('authorization');
        
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const token = auth.replace('Bearer ', '');
                const payload = jwt.verify(token, JWT_SECRET) as any;
                const userId = payload.userId || payload._id;

                if (userId) {
                    const user = await db.collection('users').findOne(
                        { _id: new ObjectId(userId) },
                        {
                            projection: {
                                aiPreferences: 1,
                                readingHistory: 1,
                                dislikedManga: 1,
                                discontinuedManga: 1
                            }
                        }
                    );

                    if (user) {
                        const aiPrefs = user.aiPreferences || DEFAULT_AI_PREFERENCES;
                        
                        // Extract preferred genres from reading history
                        if (user.readingHistory && user.readingHistory.length > 0) {
                            const readMangaIds = user.readingHistory
                                .map((h: any) => h.mangaId)
                                .filter(Boolean)
                                .slice(0, 10);
                            
                            if (readMangaIds.length > 0) {
                                const readManga = await db.collection('manga')
                                    .find({ _id: { $in: readMangaIds.map((id: string) => new ObjectId(id)) } })
                                    .project({ genres: 1 })
                                    .toArray();
                                
                                const genreCounts: { [key: string]: number } = {};
                                readManga.forEach((m: any) => {
                                    if (m.genres) {
                                        m.genres.forEach((genre: string) => {
                                            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                                        });
                                    }
                                });
                                
                                userPreferences.preferredGenres = Object.keys(genreCounts)
                                    .sort((a, b) => genreCounts[b] - genreCounts[a])
                                    .slice(0, 5);
                            }
                        }

                        // Get disliked manga IDs and genres
                        const dislikedMangaIds = (user.dislikedManga || []).map((f: any) => 
                            typeof f === 'string' ? f : f.mangaId
                        ).filter(Boolean);
                        
                        userPreferences.dislikedMangaIds = dislikedMangaIds;
                        userPreferences.excludeDislikedManga = aiPrefs.excludeDislikedManga || false;
                        
                        if (dislikedMangaIds.length > 0) {
                            const dislikedMangaDocs = await db.collection('manga')
                                .find({ _id: { $in: dislikedMangaIds.slice(0, 10).map((id: string) => new ObjectId(id)) } })
                                .project({ genres: 1 })
                                .toArray();
                            
                            const dislikedGenres = new Set<string>();
                            dislikedMangaDocs.forEach((m: any) => {
                                if (m.genres) {
                                    m.genres.forEach((genre: string) => dislikedGenres.add(genre));
                                }
                            });
                            
                            userPreferences.dislikedGenres = Array.from(dislikedGenres);
                        }
                    }
                }
            } catch (error) {
                // If token is invalid, continue without user preferences
                console.log('Token verification failed, using basic search');
            }
        }

        // Fetch all manga (or a reasonable subset)
        const allManga = await db.collection('manga')
            .find({})
            .project({
                _id: 1,
                title: 1,
                description: 1,
                genres: 1,
                tags: 1,
                author: 1,
                status: 1,
                rating: 1,
                views: 1,
                coverImage: 1,
                likes: 1,
                chapters: 1
            })
            .limit(1000) // Limit for performance
            .toArray();

        // Convert to semantic search format
        const mangaDocuments = allManga.map((m: any) => ({
            _id: m._id.toString(),
            title: m.title || '',
            description: m.description || '',
            genres: m.genres || [],
            tags: m.tags || [],
            author: m.author || '',
            status: m.status || '',
            rating: m.rating || 0
        }));

        // Perform deep learning semantic search
        const searchEngine = getDeepSemanticSearchEngine();
        const results = await searchEngine.searchWithPreferences(
            query,
            mangaDocuments,
            {
                preferredGenres: userPreferences.preferredGenres,
                dislikedGenres: userPreferences.dislikedGenres,
                minRating: userPreferences.minRating,
                excludeDislikedManga: userPreferences.excludeDislikedManga || false,
                dislikedMangaIds: userPreferences.dislikedMangaIds || []
            },
            limit
        );

        // Map back to full manga data
        const resultManga = results.map(result => {
            const fullManga = allManga.find((m: any) => m._id.toString() === result.manga._id);
            return {
                ...fullManga,
                searchScore: result.score,
                matchReasons: result.matchReasons
            };
        });

        return NextResponse.json({
            results: resultManga,
            query,
            total: resultManga.length,
            source: 'semantic-search'
        });
    } catch (error) {
        console.error('Semantic search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

