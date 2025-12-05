import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Search Service - Anime Search
 * Full-text search with filters, facets, and autocomplete
 * In production, would use Elasticsearch for better performance
 */

export const dynamic = 'force-dynamic';

// GET /api/search/anime - Search anime with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const year = searchParams.get('year');
        const rating = searchParams.get('rating');
        const sort = searchParams.get('sort') || 'relevance'; // 'relevance' | 'rating' | 'year' | 'popularity'
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build search query
        const mongoQuery: any = {};

        // Text search
        if (query) {
            mongoQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { 'titleAlternatives': { $regex: query, $options: 'i' } },
            ];
        }

        // Filters
        if (genre && genre !== 'all') {
            mongoQuery.genres = { $in: [new RegExp(genre, 'i')] };
        }

        if (status && status !== 'all') {
            mongoQuery.status = status;
        }

        if (year) {
            const yearNum = parseInt(year);
            if (!isNaN(yearNum)) {
                mongoQuery.year = yearNum;
            }
        }

        if (rating) {
            const ratingNum = parseFloat(rating);
            if (!isNaN(ratingNum)) {
                mongoQuery.rating = { $gte: ratingNum };
            }
        }

        // Build sort
        let sortQuery: any = {};
        switch (sort) {
            case 'rating':
                sortQuery = { rating: -1, ratingCount: -1 };
                break;
            case 'year':
                sortQuery = { year: -1 };
                break;
            case 'popularity':
                sortQuery = { episodeCount: -1, rating: -1 };
                break;
            default: // relevance
                sortQuery = query 
                    ? { $text: { $score: { $meta: 'textScore' } } }
                    : { createdAt: -1 };
        }

        // Execute search
        const results = await db.collection('anime_series')
            .find(mongoQuery)
            .sort(sortQuery)
            .limit(limit)
            .skip(skip)
            .toArray();

        // Get total count
        const total = await db.collection('anime_series').countDocuments(mongoQuery);

        // Get facets (for filter UI)
        const genres = await db.collection('anime_series')
            .distinct('genres');
        
        const years = await db.collection('anime_series')
            .distinct('year')
            .then(years => years.sort((a, b) => b - a));

        const statuses = await db.collection('anime_series')
            .distinct('status');

        return NextResponse.json({
            query,
            results: results.map(series => ({
                _id: series._id.toString(),
                title: series.title,
                description: series.description,
                coverImage: series.coverImage,
                bannerImage: series.bannerImage,
                genres: series.genres,
                rating: series.rating,
                year: series.year,
                status: series.status,
                episodeCount: series.episodeCount,
            })),
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total,
            },
            facets: {
                genres: genres.sort(),
                years,
                statuses,
            },
        });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: error.message },
            { status: 500 }
        );
    }
}



