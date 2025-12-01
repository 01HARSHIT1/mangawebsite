import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET() {
    try {
        // TODO: Replace with actual database query for user's watch history
        const recentAnime = [
            {
                _id: '1',
                title: 'Demon Slayer: Kimetsu no Yaiba',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                genres: ['Action', 'Supernatural'],
                rating: 9.2,
                year: 2019,
                status: 'completed' as const,
                episodeCount: 44,
                latestEpisode: 12,
            },
        ];

        return NextResponse.json({ anime: recentAnime });
    } catch (error) {
        console.error('Error fetching recent anime:', error);
        return NextResponse.json({ error: 'Failed to fetch recent anime' }, { status: 500 });
    }
}

