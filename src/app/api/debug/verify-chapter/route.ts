import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get the most recently created chapter (should be Chapter 2)
        const latestChapters = await db.collection('chapters')
            .find()
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();

        if (latestChapters.length === 0) {
            return NextResponse.json({
                error: 'No chapters found in database'
            }, { status: 404 });
        }

        const diagnostics = [];

        for (const chapter of latestChapters) {
            const hasPdfUrl = chapter.pdfUrl && typeof chapter.pdfUrl === 'string' && chapter.pdfUrl.length > 0;
            const hasPages = chapter.pages && Array.isArray(chapter.pages) && chapter.pages.length > 0;
            const firstPageIsPdf = hasPages && (
                (typeof chapter.pages[0] === 'string' && chapter.pages[0].toLowerCase().endsWith('.pdf')) ||
                (chapter.pages[0]?.imagePath && typeof chapter.pages[0].imagePath === 'string' && chapter.pages[0].imagePath.toLowerCase().endsWith('.pdf')) ||
                (chapter.pages[0]?.format === 'pdf')
            );

            let renderResult = 'No Pages Available';
            let pdfUrlToRender = null;

            if (hasPdfUrl) {
                renderResult = 'PDF Viewer (from pdfUrl)';
                pdfUrlToRender = chapter.pdfUrl;
            } else if (firstPageIsPdf) {
                renderResult = 'PDF Viewer (from pages[0])';
                pdfUrlToRender = typeof chapter.pages[0] === 'string' ? chapter.pages[0] : chapter.pages[0].imagePath;
            } else if (hasPages) {
                renderResult = `Image Pages (${chapter.pages.length} pages)`;
            }

            diagnostics.push({
                chapterId: chapter._id.toString(),
                mangaId: chapter.mangaId,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
                subtitle: chapter.subtitle || 'N/A',
                createdAt: chapter.createdAt,
                fields: {
                    pdfUrl: chapter.pdfUrl || 'NOT SET',
                    pdfPublicId: chapter.pdfPublicId || 'NOT SET',
                    pagesCount: chapter.pages?.length || 0,
                    firstPageStructure: chapter.pages && chapter.pages.length > 0 ? chapter.pages[0] : null
                },
                checks: {
                    hasPdfUrl,
                    hasPages,
                    firstPageIsPdf
                },
                renderResult,
                pdfUrlToRender,
                chapterUrl: `/manga/${chapter.mangaId}/chapter/${chapter._id.toString()}`
            });
        }

        return NextResponse.json({
            success: true,
            totalChapters: latestChapters.length,
            diagnostics
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        return NextResponse.json({
            error: 'Failed to verify chapter data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

