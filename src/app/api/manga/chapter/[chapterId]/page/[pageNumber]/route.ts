import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
    request: NextRequest,
    { params }: { params: { chapterId: string; pageNumber: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get the chapter
        const chapter = await db.collection('chapters').findOne({
            _id: new ObjectId(params.chapterId)
        });

        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Get the specific page
        const pageNumber = parseInt(params.pageNumber);
        const page = chapter.pages.find((p: any) => p.pageNumber === pageNumber);

        if (!page || !page.imageData) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(page.imageData, 'base64');

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': `image/${page.format}`,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                'Content-Length': imageBuffer.length.toString()
            }
        });

    } catch (error) {
        console.error('Error serving manga page:', error);
        return NextResponse.json({
            error: 'Failed to serve manga page',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
