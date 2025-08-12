import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import './globals.css'; // or '../globals.css' depending on your structure

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
            readMangaIds.add(mangaId);
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
        // If no reading history, return trending manga
        if (userGenres.size === 0) {
            const trendingManga = await manga
                .find({})
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
            return NextResponse.json({ manga: trendingManga });
        }
        // Get personalized recommendations based on user's preferred genres
        const userGenreArray = Array.from(userGenres);
        // Find manga with similar genres that user hasn't read
        const recommendations = await manga
            .aggregate([
                {
                    $match: {
                        _id: { $nin: Array.from(readMangaIds).map(id => new ObjectId(id)) },
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
                    _id: { $nin: Array.from(readMangaIds).map(id => new ObjectId(id)) },
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
        return NextResponse.json({ manga: finalRecommendations });
    } catch (error) {
        console.error('Error getting personalized recommendations:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 