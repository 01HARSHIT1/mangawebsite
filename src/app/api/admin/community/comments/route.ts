import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all comments for moderation
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const mangaId = searchParams.get('mangaId');
        const chapterId = searchParams.get('chapterId');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const query: any = {};
        if (mangaId) query.mangaId = mangaId;
        if (chapterId) query.chapterId = chapterId;

        const comments = await db.collection('comments')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Get user info for each comment
        const commentsWithUsers = await Promise.all(
            comments.map(async (comment) => {
                const user = await db.collection('users').findOne({ _id: new ObjectId(comment.userId) });
                return {
                    ...comment,
                    _id: comment._id.toString(),
                    userId: comment.userId?.toString(),
                    username: user?.username || user?.nickname || 'Unknown',
                    email: user?.email || ''
                };
            })
        );

        const total = await db.collection('comments').countDocuments(query);

        return NextResponse.json({
            comments: commentsWithUsers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Failed to fetch comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// DELETE: Delete comment (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('id');

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const result = await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete comment:', error);
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
}

