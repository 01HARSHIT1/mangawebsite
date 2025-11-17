import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DELETE: Delete a chapter (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { chapterId: string } }
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

        // Validate chapterId
        if (!ObjectId.isValid(params.chapterId)) {
            return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
        }

        // Check if chapter exists
        const chapter = await db.collection('chapters').findOne({ _id: new ObjectId(params.chapterId) });
        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Delete the chapter
        const result = await db.collection('chapters').deleteOne({ _id: new ObjectId(params.chapterId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
        }

        // Also delete associated comments and bookmarks
        await db.collection('comments').deleteMany({ chapterId: params.chapterId });
        await db.collection('bookmarks').deleteMany({ chapterId: params.chapterId });

        return NextResponse.json({
            success: true,
            message: 'Chapter deleted successfully'
        });
    } catch (error) {
        console.error('Admin chapter delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete chapter' },
            { status: 500 }
        );
    }
}

