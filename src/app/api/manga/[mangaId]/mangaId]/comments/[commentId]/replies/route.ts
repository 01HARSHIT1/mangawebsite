import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Add a reply to a comment
export async function POST(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
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
            return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
        }
        if (content.length > 50) {
            return NextResponse.json({ error: 'Reply too long (max 50 characters)' }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');
        const users = db.collection('users');
        // Verify user exists
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        // Find the comment
        const comment = await comments.findOne({
            _id: new ObjectId(params.commentId),
            mangaId: params.mangaId,
        });
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        // Create reply
        const reply = {
            _id: new ObjectId(),
            userId: new ObjectId(userId),
            content: content.trim(),
            likes: [],
            createdAt: new Date(),
        };
        // Add reply to comment
        const result = await comments.updateOne(
            { _id: new ObjectId(params.commentId) },
            { $push: { replies: reply } }
        );
        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        // Update user's comment count
        await users.updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { totalComments: 1 } }
        );
        return NextResponse.json({
            reply: {
                ...reply,
                user: {
                    _id: user._id,
                    nickname: user.nickname,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                },
            },
            message: 'Reply added successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding reply:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 