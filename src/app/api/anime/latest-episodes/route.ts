import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get latest episodes (most recently added)
        const latestEpisodes = await db.collection('anime_episodes')
            .find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        // Enrich with series data
        const enrichedEpisodes = await Promise.all(
            latestEpisodes.map(async (episode) => {
                const series = await db.collection('anime_series')
                    .findOne({ _id: new ObjectId(episode.seriesId) });

                return {
                    _id: episode._id.toString(),
                    episodeNumber: episode.episodeNumber,
                    title: episode.title || `Episode ${episode.episodeNumber}`,
                    thumbnail: episode.thumbnail || episode.coverImage || series?.coverImage,
                    duration: episode.duration || 1440,
                    airDate: episode.airDate || episode.createdAt,
                    seriesId: episode.seriesId?.toString() || series?._id?.toString(),
                    seriesTitle: series?.title || 'Unknown Series',
                    seriesCoverImage: series?.coverImage,
                };
            })
        );

        return NextResponse.json({ episodes: enrichedEpisodes });
    } catch (error) {
        console.error('Error fetching latest episodes:', error);
        return NextResponse.json({ episodes: [] });
    }
}

