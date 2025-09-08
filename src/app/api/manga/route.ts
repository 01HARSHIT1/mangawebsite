import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Build query
        const query: any = {};

        if (genre) {
            query.genres = { $in: [genre] };
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { creator: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const total = await db.collection('manga').countDocuments(query);

        // Get manga with pagination
        const manga = await db.collection('manga')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Transform data
        const transformedManga = manga.map(m => ({
            _id: m._id.toString(),
            title: m.title,
            creator: m.creator,
            description: m.description,
            genres: m.genres || [],
            status: m.status || 'ongoing',
            coverImage: m.coverImage,
            views: m.views || 0,
            likes: m.likes || 0,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
        }));

        return NextResponse.json({
            manga: transformedManga,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching manga:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga' },
            { status: 500 }
        );
    }
}