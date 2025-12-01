import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET() {
    try {
        // TODO: Replace with actual database query
        const popularAnime = [
            {
                _id: '1',
                title: 'Demon Slayer: Kimetsu no Yaiba',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Supernatural'],
                rating: 9.2,
                year: 2019,
                status: 'completed' as const,
                episodeCount: 44,
            },
            {
                _id: '2',
                title: 'Attack on Titan',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Drama'],
                rating: 9.5,
                year: 2013,
                status: 'completed' as const,
                episodeCount: 75,
            },
            {
                _id: '3',
                title: 'Jujutsu Kaisen',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Supernatural'],
                rating: 8.9,
                year: 2020,
                status: 'ongoing' as const,
                episodeCount: 24,
            },
            {
                _id: '4',
                title: 'My Hero Academia',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Superhero'],
                rating: 8.7,
                year: 2016,
                status: 'ongoing' as const,
                episodeCount: 113,
            },
            {
                _id: '5',
                title: 'One Punch Man',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Comedy'],
                rating: 9.0,
                year: 2015,
                status: 'ongoing' as const,
                episodeCount: 24,
            },
        ];

        return NextResponse.json({ anime: popularAnime });
    } catch (error) {
        console.error('Error fetching popular anime:', error);
        return NextResponse.json({ error: 'Failed to fetch popular anime' }, { status: 500 });
    }
}

