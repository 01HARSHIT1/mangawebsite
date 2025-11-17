import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all chapters for a manga (admin only)
export async function GET(
    request: NextRequest,
    { params }: { params: { mangaId: string } }
) {
    try {
        // Verify admin authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Validate mangaId
        if (!ObjectId.isValid(params.mangaId)) {
            return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
        }

        // Fetch chapters for this manga
        const chapters = await db.collection('chapters')
            .find({ mangaId: params.mangaId })
            .sort({ chapterNumber: 1, createdAt: 1 })
            .toArray();

        const chaptersWithIds = chapters.map((ch) => ({
            _id: ch._id.toString(),
            title: ch.title || `Chapter ${ch.chapterNumber || 'N/A'}`,
            chapterNumber: ch.chapterNumber || 0,
            subtitle: ch.subtitle || '',
            description: ch.description || '',
            coverPage: ch.coverPage || '',
            pageCount: Array.isArray(ch.pages) ? ch.pages.length : ch.pageCount || 0,
            pages: ch.pages || [],
            publishDate: ch.publishDate || null,
            createdAt: ch.createdAt ? ch.createdAt.toString() : null,
            views: ch.views || 0,
            likes: Array.isArray(ch.likes) ? ch.likes.length : ch.likes || 0,
            status: ch.status || 'published',
            coinPrice: ch.coinPrice || 0,
            uploaderId: ch.uploaderId ? (typeof ch.uploaderId === 'string' ? ch.uploaderId : ch.uploaderId.toString()) : null
        }));

        return NextResponse.json({
            chapters: chaptersWithIds,
            total: chaptersWithIds.length
        });
    } catch (error) {
        console.error('Admin chapters fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chapters' },
            { status: 500 }
        );
    }
}

