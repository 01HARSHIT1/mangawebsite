import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Search Service - Autocomplete Suggestions
 * Provides search suggestions as user types
 */

export const dynamic = 'force-dynamic';

// GET /api/search/anime/suggest - Get autocomplete suggestions
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const q = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!q || q.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Search titles and alternative titles
        const results = await db.collection('anime_series')
            .find({
                $or: [
                    { title: { $regex: `^${q}`, $options: 'i' } },
                    { title: { $regex: q, $options: 'i' } },
                    { 'titleAlternatives': { $regex: q, $options: 'i' } },
                ],
            })
            .limit(limit)
            .project({
                _id: 1,
                title: 1,
                coverImage: 1,
                year: 1,
                status: 1,
            })
            .toArray();

        const suggestions = results.map(series => ({
            id: series._id.toString(),
            title: series.title,
            coverImage: series.coverImage,
            year: series.year,
            status: series.status,
        }));

        return NextResponse.json({ suggestions });
    } catch (error: any) {
        console.error('Autocomplete error:', error);
        return NextResponse.json(
            { error: 'Autocomplete failed', details: error.message },
            { status: 500 }
        );
    }
}



