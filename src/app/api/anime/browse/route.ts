import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Mock data - Replace with actual database queries
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // TODO: Replace with actual database query
        const allAnime = [
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

        let filteredAnime = allAnime;

        // Filter by genre
        if (genre && genre !== 'all') {
            filteredAnime = filteredAnime.filter((anime) =>
                anime.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
            );
        }

        // Filter by status
        if (status && status !== 'all') {
            filteredAnime = filteredAnime.filter((anime) => anime.status === status);
        }

        // Filter by search query
        if (search) {
            const searchLower = search.toLowerCase();
            filteredAnime = filteredAnime.filter((anime) =>
                anime.title.toLowerCase().includes(searchLower)
            );
        }

        return NextResponse.json({ anime: filteredAnime });
    } catch (error) {
        console.error('Error fetching anime:', error);
        return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 });
    }
}

