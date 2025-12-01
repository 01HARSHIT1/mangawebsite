import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET(
    request: Request,
    { params }: { params: { seriesId: string } }
) {
    try {
        const { seriesId } = params;

        // TODO: Replace with actual database query
        const series = {
            _id: seriesId,
            title: 'Demon Slayer: Kimetsu no Yaiba',
            description: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister Nezuko, who has been turned into a demon. Along the way, he meets other demon slayers and faces powerful demons.',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
            genres: ['Action', 'Supernatural', 'Historical', 'Shounen'],
            rating: 9.2,
            year: 2019,
            status: 'completed' as const,
            episodeCount: 44,
            totalEpisodes: 44,
            studio: 'Ufotable',
            director: 'Haruo Sotozaki',
        };

        return NextResponse.json(series);
    } catch (error) {
        console.error('Error fetching series:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}

