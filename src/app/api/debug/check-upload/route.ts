import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive diagnostic to check what's actually in the database
 * and verify the upload flow is working
 */
export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get all manga with full details
        const allManga = await db.collection('manga')
            .find()
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Get all chapters
        const allChapters = await db.collection('chapters')
            .find()
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Get all users to see their IDs
        const allUsers = await db.collection('users')
            .find()
            .project({ _id: 1, username: 1, email: 1, role: 1, isCreator: 1 })
            .toArray();

        const report = {
            database: {
                totalManga: allManga.length,
                totalChapters: allChapters.length,
                totalUsers: allUsers.length
            },
            manga: allManga.map(m => ({
                _id: m._id.toString(),
                title: m.title,
                creator: m.creator,
                uploaderId: m.uploaderId || 'MISSING',
                coverImage: typeof m.coverImage === 'string' ? 'STRING (✅)' : `OBJECT (❌): ${JSON.stringify(m.coverImage)}`,
                coverImageValue: m.coverImage,
                genres: m.genres,
                status: m.status,
                views: m.views,
                likes: m.likes,
                createdAt: m.createdAt,
                hasAllRequiredFields: !!(m.title && m.creator && m.description && m.coverImage && m.uploaderId)
            })),
            chapters: allChapters.map(ch => ({
                _id: ch._id.toString(),
                mangaId: ch.mangaId,
                chapterNumber: ch.chapterNumber,
                title: ch.title,
                hasPdfUrl: !!ch.pdfUrl,
                pdfUrl: ch.pdfUrl || 'MISSING',
                hasPages: ch.pages?.length > 0,
                pagesCount: ch.pages?.length || 0,
                createdAt: ch.createdAt
            })),
            users: allUsers.map(u => ({
                _id: u._id.toString(),
                username: u.username,
                email: u.email,
                role: u.role,
                isCreator: u.isCreator
            })),
            issues: []
        };

        // Identify issues
        allManga.forEach(m => {
            if (!m.uploaderId) {
                report.issues.push(`Manga "${m.title}" has no uploaderId`);
            }
            if (typeof m.coverImage !== 'string') {
                report.issues.push(`Manga "${m.title}" has coverImage as object instead of string`);
            }
            if (!m.genres || m.genres.length === 0) {
                report.issues.push(`Manga "${m.title}" has no genres`);
            }
        });

        allChapters.forEach(ch => {
            if (!ch.pdfUrl && (!ch.pages || ch.pages.length === 0)) {
                report.issues.push(`Chapter ${ch.chapterNumber} has no pdfUrl and no pages`);
            }
        });

        return NextResponse.json(report, { status: 200 });

    } catch (error) {
        console.error('❌ Diagnostic error:', error);
        return NextResponse.json({
            error: 'Diagnostic failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

