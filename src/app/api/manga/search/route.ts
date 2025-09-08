import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

// GET: Search manga with advanced filters
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const rating = parseFloat(searchParams.get('rating') || '0');
    const yearFrom = parseInt(searchParams.get('yearFrom') || '1990');
    const yearTo = parseInt(searchParams.get('yearTo') || new Date().getFullYear().toString());
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    try {
        const client = await clientPromise;
        const db = client.db();
        const manga = db.collection('manga');
        // Build search query
        const searchQuery: any = {};
        // Text search
        if (query.trim()) {
            searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { author: { $regex: query, $options: 'i' } },
                { alternativeTitles: { $regex: query, $options: 'i' } },
            ];
        }
        // Genre filter
        if (genres.length > 0) {
            searchQuery.genres = { $in: genres };
        }
        // Status filter
        if (status.length > 0) {
            searchQuery.status = { $in: status };
        }
        // Rating filter
        if (rating > 0) {
            searchQuery.rating = { $gte: rating };
        }
        // Year filter
        if (yearFrom > 1990 || yearTo < new Date().getFullYear()) {
            searchQuery.year = {};
            if (yearFrom > 1990) searchQuery.year.$gte = yearFrom;
            if (yearTo < new Date().getFullYear()) searchQuery.year.$lte = yearTo;
        }
        // Build sort object
        let sortObject: any = {};
        switch (sortBy) {
            case 'title':
                sortObject.title = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'rating':
                sortObject.rating = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'views':
                sortObject.views = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'likes':
                sortObject.likes = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'newest':
                sortObject.createdAt = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'oldest':
                sortObject.createdAt = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'relevance':
            default:
                // For relevance, use text score if there's a query, otherwise by rating
                if (query.trim()) {
                    sortObject.score = { $meta: 'textScore' };
                } else {
                    sortObject.rating = -1;
                }
                break;
        }
        // Add secondary sort for relevance
        if (sortBy === 'relevance' && query.trim()) {
            sortObject.rating = -1;
        }
        // Create text index for search if it doesn't exist
        try {
            await manga.createIndex({
                title: 'text',
                description: 'text',
                author: 'text',
                alternativeTitles: 'text',
            });
        } catch (error) {
            // Index might already exist
        }
        // Execute search
        const results = await manga
            .find(searchQuery)
            .sort(sortObject)
            .skip(skip)
            .limit(limit)
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
                createdAt: 1,
            })
            .toArray();
        // Filter out coverImage if file does not exist
        const filteredResults = results.map(m => {
            if (m.coverImage) {
                const coversDir = path.join(process.cwd(), 'public', 'manga-covers');
                const filePath = path.join(coversDir, path.basename(m.coverImage));
                if (!fs.existsSync(filePath)) {
                    delete m.coverImage;
                }
            }
            return m;
        });
        // Get total count
        const total = await manga.countDocuments(searchQuery);
        return NextResponse.json({
            manga: filteredResults,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            filters: {
                query,
                genres,
                status,
                rating,
                yearFrom,
                yearTo,
                sortBy,
                sortOrder,
            },
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 