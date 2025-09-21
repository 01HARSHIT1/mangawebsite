import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getMockManga } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Try MongoDB first, fallback to mock data
        try {
            const client = await clientPromise;
            const db = client.db('mangawebsite');

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

            // Build sort
            let sortQuery: any = { createdAt: -1 }; // Default sort
            switch (sort) {
                case 'trending':
                case 'featured':
                    sortQuery = { views: -1, likes: -1 };
                    break;
                case 'top':
                    sortQuery = { likes: -1, views: -1 };
                    break;
                case 'newest':
                    sortQuery = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortQuery = { createdAt: 1 };
                    break;
            }

            // Get total count
            const total = await db.collection('manga').countDocuments(query);

            // Get manga with pagination
            const manga = await db.collection('manga')
                .find(query)
                .sort(sortQuery)
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
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total
                }
            });

        } catch (mongoError) {
            console.log('MongoDB not available, using mock data:', mongoError.message);

            // Use mock data when MongoDB is not available
            const mockResult = await getMockManga({
                sort,
                page,
                limit,
                search,
                genre,
                status
            });

            return NextResponse.json(mockResult);
        }

    } catch (error) {
        console.error('Error in manga API:', error);

        // Final fallback to mock data
        try {
            const mockResult = await getMockManga({
                sort: 'trending',
                page: 1,
                limit: 8
            });
            return NextResponse.json(mockResult);
        } catch (mockError) {
            return NextResponse.json(
                { error: 'Failed to fetch manga', manga: [], pagination: { page: 1, limit: 8, total: 0, pages: 0 } },
                { status: 500 }
            );
        }
    }
}