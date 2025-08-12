import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: Get similar manga recommendations
export async function GET(req: NextRequest, { params }: { params: { mangaId: string } }) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const manga = db.collection('manga');
        // Get the current manga details
        const currentManga = await manga.findOne({ _id: new ObjectId(params.mangaId) });
        if (!currentManga) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }
        const currentGenres = currentManga.genres || [];
        const currentAuthor = currentManga.author;
        const currentYear = currentManga.year;
        // Find similar manga based on genres, author, and year
        const similarManga = await manga.aggregate([
            {
                $match: {
                    _id: { $ne: new ObjectId(params.mangaId) },
                },
            },
            {
                $addFields: {
                    // Calculate similarity score
                    similarityScore: {
                        $add: [
                            // Genre similarity (weight: 50%)
                            {
                                $multiply: [
                                    { $size: { $setIntersection: ['$genres', currentGenres] } },
                                    50,
                                ],
                            },
                            // Author similarity (weight: 30%)
                            {
                                $cond: [
                                    { $eq: ['$author', currentAuthor] },
                                    30,
                                    0,
                                ],
                            },
                            // Year similarity (weight: 20%)
                            {
                                $multiply: [
                                    {
                                        $subtract: [
                                            1,
                                            {
                                                $divide: [
                                                    { $abs: { $subtract: ['$year', currentYear] } },
                                                    5,
                                                ],
                                            },
                                        ],
                                    },
                                    20,
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $match: {
                    similarityScore: { $gt: 0 },
                },
            },
            { $sort: { similarityScore: -1 } },
            { $limit: 12 },
            {
                $addFields: {
                    // Normalize similarity score to 0-1 range
                    similarity: {
                        $divide: ['$similarityScore', 100],
                    },
                },
            },
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
                    similarity: 1,
                },
            },
        ]).toArray();
        return NextResponse.json({ manga: similarManga });
    } catch (error) {
        console.error('Error getting similar manga:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 