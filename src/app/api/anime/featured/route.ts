import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET() {
    try {
        // TODO: Replace with actual database query
        const featuredAnime = {
            _id: '1',
            title: 'Demon Slayer: Kimetsu no Yaiba',
            description: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister Nezuko, who has been turned into a demon. Along the way, he meets other demon slayers and faces powerful demons in epic battles.',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
            genres: ['Action', 'Supernatural', 'Historical'],
            rating: 9.2,
            year: 2019,
            status: 'completed' as const,
            episodeCount: 44,
            latestEpisode: 44,
        };

        return NextResponse.json({ anime: featuredAnime });
    } catch (error) {
        console.error('Error fetching featured anime:', error);
        return NextResponse.json({ error: 'Failed to fetch featured anime' }, { status: 500 });
    }
}

