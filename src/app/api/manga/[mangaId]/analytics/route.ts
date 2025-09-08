import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
    request: NextRequest,
    { params }: { params: { mangaId: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get manga analytics data
        const manga = await db.collection('manga').findOne({ _id: new ObjectId(params.mangaId) });

        if (!manga) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }

        // Get view count and engagement data
        const analytics = {
            seriesEngagement: [{
                _id: params.mangaId,
                views: manga.views || 0,
                likes: manga.likes?.length || 0,
                bookmarks: 0, // Will be calculated from user bookmarks
                chapters: 0
            }]
        };

        // Get chapter count
        const chapterCount = await db.collection('chapters').countDocuments({
            mangaId: params.mangaId
        });
        analytics.seriesEngagement[0].chapters = chapterCount;

        // Get total bookmarks for this manga
        const bookmarkCount = await db.collection('users').countDocuments({
            bookmarks: params.mangaId
        });
        analytics.seriesEngagement[0].bookmarks = bookmarkCount;

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching manga analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
