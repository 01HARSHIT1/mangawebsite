import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET(
    request: Request,
    { params }: { params: { seriesId: string } }
) {
    try {
        const { seriesId } = params;

        // TODO: Replace with actual database query
        const episodes = Array.from({ length: 44 }, (_, i) => ({
            _id: `ep-${i + 1}`,
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`,
            description: `This is episode ${i + 1} of the series.`,
            thumbnail: `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400`,
            duration: 1440, // 24 minutes in seconds
            airDate: new Date(2019, 3, i + 1).toISOString(),
            watched: i < 12, // First 12 episodes watched
        }));

        return NextResponse.json({ episodes });
    } catch (error) {
        console.error('Error fetching episodes:', error);
        return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
    }
}

