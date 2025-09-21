import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Like a comment
export async function POST(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
    try {
        // Verify authentication
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const token = auth.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        const { mangaId, commentId } = params;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Check if user already liked this comment
        const existingLike = await db.collection('commentLikes').findOne({
            userId: new ObjectId(userId),
            commentId: new ObjectId(commentId)
        });

        if (existingLike) {
            return NextResponse.json({ error: 'Comment already liked' }, { status: 400 });
        }

        // Add like to comment
        await db.collection('commentLikes').insertOne({
            userId: new ObjectId(userId),
            commentId: new ObjectId(commentId),
            mangaId: new ObjectId(mangaId),
            createdAt: new Date()
        });

        // Update comment like count
        await db.collection('comments').updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { likes: 1 } }
        );

        return NextResponse.json({ success: true, message: 'Comment liked' });
    } catch (error) {
        console.error('Error liking comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Unlike a comment
export async function DELETE(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
    try {
        // Verify authentication
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const token = auth.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        const { mangaId, commentId } = params;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Remove like from comment
        const result = await db.collection('commentLikes').deleteOne({
            userId: new ObjectId(userId),
            commentId: new ObjectId(commentId)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Like not found' }, { status: 404 });
        }

        // Update comment like count
        await db.collection('comments').updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { likes: -1 } }
        );

        return NextResponse.json({ success: true, message: 'Comment unliked' });
    } catch (error) {
        console.error('Error unliking comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}