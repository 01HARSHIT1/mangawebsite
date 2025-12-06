import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's manga
        const manga = await db.collection('manga')
            .find({ uploaderId: user._id })
            .sort({ createdAt: -1 })
            .toArray();

        // Get creator's anime series
        const animeSeries = await db.collection('anime_series')
            .find({ creatorId: user._id })
            .sort({ createdAt: -1 })
            .toArray();

        // Calculate manga stats
        const totalManga = manga.length;
        let totalChapters = 0;
        let totalMangaViews = 0;
        let totalMangaLikes = 0;

        for (const m of manga) {
            const chapters = await db.collection('chapters')
                .find({ mangaId: m._id.toString() })
                .toArray();

            totalChapters += chapters.length;
            totalMangaViews += m.views || 0;
            totalMangaLikes += m.likes || 0;
        }

        // Calculate anime stats
        const totalAnime = animeSeries.length;
        let totalEpisodes = 0;
        let totalAnimeViews = 0;
        let totalAnimeLikes = 0;

        for (const a of animeSeries) {
            const episodes = await db.collection('anime_episodes')
                .find({ seriesId: a._id.toString() })
                .toArray();

            totalEpisodes += episodes.length;
            totalAnimeViews += a.views || 0;
            totalAnimeLikes += a.likes || 0;
        }

        // Get recent manga with additional info
        const mangaSeries = await Promise.all(
            manga.map(async (m) => {
                const chapterCount = await db.collection('chapters')
                    .countDocuments({ mangaId: m._id.toString() });

                return {
                    _id: m._id.toString(),
                    title: m.title,
                    description: m.description || '',
                    status: m.status || 'draft',
                    coverImage: typeof m.coverImage === 'string'
                        ? m.coverImage
                        : m.coverImage?.secure_url || '',
                    views: m.views || 0,
                    likes: Array.isArray(m.likes) ? m.likes.length : m.likes || 0,
                    genres: m.genres || [],
                    chapterCount,
                    type: 'manga',
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt || m.createdAt,
                    lastPublishedAt: m.lastPublishedAt || null
                };
            })
        );

        // Get recent anime with additional info
        const animeSeriesList = await Promise.all(
            animeSeries.map(async (a) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: a._id.toString() });

                return {
                    _id: a._id.toString(),
                    title: a.title,
                    description: a.description || a.synopsis || '',
                    status: a.status || 'draft',
                    coverImage: a.coverImage || a.bannerImage || '',
                    views: a.views || 0,
                    likes: a.likes || 0,
                    genres: a.genres || [],
                    episodeCount,
                    type: 'anime',
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt || a.createdAt,
                    lastPublishedAt: a.lastPublishedAt || null
                };
            })
        );

        // Combine both types
        const allSeries = [...mangaSeries, ...animeSeriesList].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({
            stats: {
                totalManga,
                totalAnime,
                totalChapters,
                totalEpisodes,
                totalViews: totalMangaViews + totalAnimeViews,
                totalLikes: totalMangaLikes + totalAnimeLikes,
            },
            series: allSeries,
            manga: mangaSeries,
            anime: animeSeriesList,
        });

    } catch (error) {
        console.error('Creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creator dashboard data' },
            { status: 500 }
        );
    }
}

