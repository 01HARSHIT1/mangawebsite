import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        
        if (genre && genre !== 'all') {
            query.genres = { $in: [new RegExp(genre, 'i')] };
        }
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Get anime from database
        let allAnime = await db.collection('anime_series')
            .find(query)
            .sort({ rating: -1, year: -1 })
            .limit(100)
            .toArray();

        // If no results, return mock data
        if (allAnime.length === 0) {
            allAnime = getMockAnime();
        } else {
            // Get episode counts
            allAnime = await Promise.all(
                allAnime.map(async (series: any) => {
                    const episodeCount = await db.collection('anime_episodes')
                        .countDocuments({ seriesId: series._id.toString() });
                    return {
                        _id: series._id.toString(),
                        title: series.title,
                        coverImage: series.coverImage,
                        genres: series.genres || [],
                        rating: series.rating || 0,
                        year: series.year || new Date().getFullYear(),
                        status: series.status || 'ongoing',
                        episodeCount: episodeCount || series.episodeCount || 0,
                    };
                })
            );
        }

        // Apply client-side filters for mock data (database already filtered)
        let filteredAnime = allAnime;
        if (allAnime.length > 0 && typeof allAnime[0]._id === 'string' && allAnime[0]._id.startsWith('1')) {
            // This is mock data, apply filters
            if (genre && genre !== 'all') {
                filteredAnime = filteredAnime.filter((anime: any) =>
                    anime.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase())
                );
            }

            if (status && status !== 'all') {
                filteredAnime = filteredAnime.filter((anime: any) => anime.status === status);
            }

            if (search) {
                const searchLower = search.toLowerCase();
                filteredAnime = filteredAnime.filter((anime: any) =>
                    anime.title.toLowerCase().includes(searchLower)
                );
            }
        }

        return NextResponse.json({ anime: filteredAnime });
    } catch (error) {
        console.error('Error fetching anime:', error);
        return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 });
    }
}

function getMockAnime() {
    return [
        {
            _id: '1',
            title: 'Demon Slayer: Kimetsu no Yaiba',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['action', 'supernatural'],
            rating: 9.2,
            year: 2019,
            status: 'completed' as const,
            episodeCount: 44,
        },
        {
            _id: '2',
            title: 'Attack on Titan',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['action', 'drama'],
            rating: 9.5,
            year: 2013,
            status: 'completed' as const,
            episodeCount: 75,
        },
        {
            _id: '3',
            title: 'Jujutsu Kaisen',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['action', 'supernatural'],
            rating: 8.9,
            year: 2020,
            status: 'ongoing' as const,
            episodeCount: 24,
        },
        {
            _id: '4',
            title: 'My Hero Academia',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['action', 'superhero'],
            rating: 8.7,
            year: 2016,
            status: 'ongoing' as const,
            episodeCount: 113,
        },
        {
            _id: '5',
            title: 'One Punch Man',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['action', 'comedy'],
            rating: 9.0,
            year: 2015,
            status: 'ongoing' as const,
            episodeCount: 24,
        },
    ];
}
