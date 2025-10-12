import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// PATCH: Update manga (admin can edit any manga)
export async function PATCH(
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

        const body = await request.json();
        const { status, title, description, genre, tags } = body;

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build update object
        const updateData: any = {
            updatedAt: new Date()
        };

        if (status) updateData.status = status;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (genre) updateData.genre = genre;
        if (tags) updateData.tags = tags;

        // Update manga
        const result = await db.collection('manga').updateOne(
            { _id: new ObjectId(params.mangaId) },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'Manga not found or no changes made' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Manga updated successfully'
        });
    } catch (error) {
        console.error('Admin manga update error:', error);
        return NextResponse.json(
            { error: 'Failed to update manga' },
            { status: 500 }
        );
    }
}

// DELETE: Delete manga (admin can delete any manga)
export async function DELETE(
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

        // Delete manga and all associated data
        await db.collection('manga').deleteOne({ _id: new ObjectId(params.mangaId) });
        await db.collection('chapters').deleteMany({ mangaId: params.mangaId });
        await db.collection('comments').deleteMany({ mangaId: params.mangaId });
        await db.collection('bookmarks').deleteMany({ mangaId: params.mangaId });

        return NextResponse.json({
            success: true,
            message: 'Manga and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Admin manga delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete manga' },
            { status: 500 }
        );
    }
}
