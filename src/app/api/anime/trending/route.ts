import { NextResponse } from 'next/server';

// Mock data - Replace with actual database queries
export async function GET() {
    try {
        // TODO: Replace with actual database query
        const trendingAnime = [
            {
                _id: '1',
                title: 'Demon Slayer: Kimetsu no Yaiba',
                description: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Supernatural'],
                rating: 9.2,
                year: 2019,
                status: 'completed' as const,
                episodeCount: 44,
                latestEpisode: 44,
            },
            {
                _id: '2',
                title: 'Attack on Titan',
                description: 'Humanity fights against giant humanoid Titans in a post-apocalyptic world.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Drama'],
                rating: 9.5,
                year: 2013,
                status: 'completed' as const,
                episodeCount: 75,
                latestEpisode: 75,
            },
            {
                _id: '3',
                title: 'Jujutsu Kaisen',
                description: 'A high school student who swallows a cursed talisman becomes embroiled in a dark world of curses and sorcerers.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Supernatural'],
                rating: 8.9,
                year: 2020,
                status: 'ongoing' as const,
                episodeCount: 47,
                latestEpisode: 47,
            },
            {
                _id: '4',
                title: 'Spy x Family',
                description: 'A spy, an assassin, and a psychic adopt a fake family to maintain peace.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Comedy', 'Slice of Life'],
                rating: 8.8,
                year: 2022,
                status: 'ongoing' as const,
                episodeCount: 37,
                latestEpisode: 37,
            },
            {
                _id: '5',
                title: 'Chainsaw Man',
                description: 'Denji merges with his pet devil Pochita to become a Chainsaw Man.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Dark Fantasy'],
                rating: 8.7,
                year: 2022,
                status: 'completed' as const,
                episodeCount: 12,
                latestEpisode: 12,
            },
        ];

        return NextResponse.json({ anime: trendingAnime });
    } catch (error) {
        console.error('Error fetching trending anime:', error);
        return NextResponse.json({ error: 'Failed to fetch trending anime' }, { status: 500 });
    }
}

