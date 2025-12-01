import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET(
    request: Request,
    { params }: { params: { seriesId: string; episodeNumber: string } }
) {
    try {
        const { seriesId, episodeNumber } = params;
        const epNum = parseInt(episodeNumber, 10);

        // TODO: Replace with actual database query
        // For now, using a mock video URL - in production, this would be a secure streaming URL
        const episode = {
            _id: `ep-${epNum}`,
            episodeNumber: epNum,
            title: `Episode ${epNum}`,
            description: `This is episode ${epNum} of the series.`,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Sample video for testing
            thumbnail: `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400`,
            duration: 1440, // 24 minutes in seconds
            airDate: new Date(2019, 3, epNum).toISOString(),
        };

        return NextResponse.json(episode);
    } catch (error) {
        console.error('Error fetching episode:', error);
        return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 });
    }
}

