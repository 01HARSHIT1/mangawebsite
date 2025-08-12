import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// PUT: Edit a comment
export async function PUT(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
    try {
        // Verify authentication
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = auth.replace('Bearer ', '');
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { content } = await req.json();
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }
        if (content.length > 100) {
            return NextResponse.json({ error: 'Comment too long (max 100 characters)' }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');
        // Find the comment
        const comment = await comments.findOne({
            _id: new ObjectId(params.commentId),
            mangaId: params.mangaId,
        });
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        // Check if user owns the comment or is admin
        if (comment.userId.toString() !== userId) {
            const users = db.collection('users');
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user || user.role !== 'admin') {
                return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
            }
        }
        // Update comment
        const result = await comments.updateOne(
            { _id: new ObjectId(params.commentId) },
            { $set: { content: content.trim(), updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Error updating comment:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete a comment
export async function DELETE(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
    try {
        // Verify authentication
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = auth.replace('Bearer ', '');
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');
        const users = db.collection('users');
        // Find the comment
        const comment = await comments.findOne({
            _id: new ObjectId(params.commentId),
            mangaId: params.mangaId,
        });
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        // Check if user owns the comment or is admin
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (comment.userId.toString() !== userId && user.role !== 'admin') {
            return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
        }
        // Delete comment
        const result = await comments.deleteOne({ _id: new ObjectId(params.commentId) });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        // Update user's comment count
        await users.updateOne(
            { _id: comment.userId },
            { $inc: { totalComments: -1 } }
        );
        return NextResponse.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 