import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateEmbedding } from '@/lib/embeddings';
import { cosineSimilarity } from '@/lib/ai-semantic-search-v2';

/**
 * Enhanced Search Service - Anime Search
 * Full-text search with semantic search capabilities, filters, facets, and autocomplete
 * Uses embeddings for semantic understanding
 */

export const dynamic = 'force-dynamic';

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// GET /api/search/anime - Enhanced search with semantic capabilities
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const year = searchParams.get('year');
        const rating = searchParams.get('rating');
        const sort = searchParams.get('sort') || 'relevance'; // 'relevance' | 'rating' | 'year' | 'popularity'
        const useSemantic = searchParams.get('semantic') !== 'false'; // Enable semantic search by default
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let results: any[] = [];
        let total = 0;

        // Semantic search if query provided and enabled
        if (query && useSemantic) {
            try {
                // Generate embedding for search query
                const queryEmbedding = await generateEmbedding(query);
                
                // Get all anime with their embeddings (or generate on-the-fly)
                const allAnime = await db.collection('anime_series')
                    .find({})
                    .toArray();

                // Calculate semantic similarity for each anime
                const scoredAnime = await Promise.all(
                    allAnime.map(async (series: any) => {
                        // Build text for embedding (title + description)
                        const seriesText = `${series.title} ${series.description || ''} ${(series.genres || []).join(' ')}`;
                        
                        // Get or generate embedding for series
                        let seriesEmbedding: number[] | null = null;
                        
                        // Check if embedding exists in cache/collection
                        const embeddingDoc = await db.collection('anime_embeddings')
                            .findOne({ seriesId: series._id.toString() });
                        
                        if (embeddingDoc && embeddingDoc.embedding) {
                            seriesEmbedding = embeddingDoc.embedding;
                        } else {
                            // Generate embedding
                            try {
                                seriesEmbedding = await generateEmbedding(seriesText);
                                
                                // Cache embedding
                                await db.collection('anime_embeddings').updateOne(
                                    { seriesId: series._id.toString() },
                                    {
                                        $set: {
                                            seriesId: series._id.toString(),
                                            embedding: seriesEmbedding,
                                            updatedAt: new Date()
                                        }
                                    },
                                    { upsert: true }
                                );
                            } catch (embedError) {
                                console.error('Error generating embedding:', embedError);
                                // Fallback to text search
                            }
                        }
                        
                        if (!seriesEmbedding) {
                            return null;
                        }
                        
                        // Calculate similarity
                        const similarity = calculateCosineSimilarity(queryEmbedding, seriesEmbedding);
                        
                        return {
                            ...series,
                            semanticScore: similarity
                        };
                    })
                );

                // Filter out nulls and apply filters
                let filtered = scoredAnime.filter((item: any) => item !== null);

                // Apply filters
                if (genre && genre !== 'all') {
                    filtered = filtered.filter((item: any) => 
                        item.genres?.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))
                    );
                }

                if (status && status !== 'all') {
                    filtered = filtered.filter((item: any) => item.status === status);
                }

                if (year) {
                    const yearNum = parseInt(year);
                    if (!isNaN(yearNum)) {
                        filtered = filtered.filter((item: any) => item.year === yearNum);
                    }
                }

                if (rating) {
                    const ratingNum = parseFloat(rating);
                    if (!isNaN(ratingNum)) {
                        filtered = filtered.filter((item: any) => (item.rating || 0) >= ratingNum);
                    }
                }

                // Sort by semantic score first, then by other criteria
                filtered.sort((a: any, b: any) => {
                    if (sort === 'rating') {
                        return (b.rating || 0) - (a.rating || 0);
                    } else if (sort === 'year') {
                        return (b.year || 0) - (a.year || 0);
                    } else if (sort === 'popularity') {
                        return ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0));
                    } else {
                        // Relevance: combine semantic score with other factors
                        const scoreA = (a.semanticScore || 0) * 0.7 + (a.rating || 0) * 0.2 + ((a.views || 0) / 10000) * 0.1;
                        const scoreB = (b.semanticScore || 0) * 0.7 + (b.rating || 0) * 0.2 + ((b.views || 0) / 10000) * 0.1;
                        return scoreB - scoreA;
                    }
                });

                total = filtered.length;
                results = filtered.slice(skip, skip + limit);
            } catch (semanticError) {
                console.error('Semantic search error, falling back to text search:', semanticError);
                // Fall back to text search
            }
        }

        // Fallback to text search if semantic search failed or disabled
        if (results.length === 0) {
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
            results = await db.collection('anime_series')
                .find(mongoQuery)
                .sort(sortQuery)
                .limit(limit)
                .skip(skip)
                .toArray();

            // Get total count
            total = await db.collection('anime_series').countDocuments(mongoQuery);
        }

        // Get facets (for filter UI)
        const genres = await db.collection('anime_series')
            .distinct('genres');
        
        const years = await db.collection('anime_series')
            .distinct('year')
            .then(years => years.sort((a, b) => b - a));

        const statuses = await db.collection('anime_series')
            .distinct('status');

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
                semanticScore: series.semanticScore || null, // Include semantic score if available
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
            searchType: useSemantic && query ? 'semantic' : 'text',
        });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: error.message },
            { status: 500 }
        );
    }
}



