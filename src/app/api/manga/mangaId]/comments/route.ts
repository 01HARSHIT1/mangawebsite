import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Fetch comments for a manga
export async function GET(req: NextRequest, { params }: { params: { mangaId: string } }) {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    try {
        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');
        // Build sort object
        let sortObject: any = { createdAt: -1 };
        switch (sortBy) {
            case 'newest':
                sortObject = { createdAt: -1 };
                break;
            case 'oldest':
                sortObject = { createdAt: 1 };
                break;
            case 'rating':
                sortObject = { rating: -1, createdAt: -1 };
                break;
            case 'likes':
                sortObject = { 'likes.length': -1, createdAt: -1 };
                break;
            default:
                sortObject = { createdAt: -1 };
        }
        // Get comments with user details
        const commentsList = await comments.aggregate([
            { $match: { mangaId: params.mangaId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    content: 1,
                    rating: 1,
                    likes: 1,
                    replies: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'user._id': 1,
                    'user.nickname': 1,
                    'user.avatarUrl': 1,
                    'user.role': 1,
                    'user.verified': 1,
                },
            },
            { $sort: sortObject },
            { $skip: skip },
            { $limit: limit },
        ]).toArray();
        // Get total count
        const totalComments = await comments.countDocuments({ mangaId: params.mangaId });
        return NextResponse.json({
            comments: commentsList,
            pagination: {
                page,
                limit,
                total: totalComments,
                totalPages: Math.ceil(totalComments / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new comment
export async function POST(req: NextRequest, { params }: { params: { mangaId: string } }) {
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
        const { content, rating } = await req.json();
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }
        if (content.length > 100) {
            return NextResponse.json({ error: 'Comment too long (max 100 characters)' }, { status: 400 });
        }
        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
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
        // Check if user already commented on this manga
        const existingComment = await comments.findOne({
            mangaId: params.mangaId,
            userId: new ObjectId(userId),
        });
        if (existingComment) {
            return NextResponse.json({ error: 'You have already commented on this manga' }, { status: 400 });
        }
        // Create comment
        const comment = {
            mangaId: params.mangaId,
            userId: new ObjectId(userId),
            content: content.trim(),
            rating: rating || null,
            likes: [],
            replies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await comments.insertOne(comment);
        // Update user's comment count
        await users.updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { totalComments: 1 } }
        );
        // Get the created comment with user details
        const createdComment = await comments.aggregate([
            { $match: { _id: result.insertedId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    content: 1,
                    rating: 1,
                    likes: 1,
                    replies: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'user._id': 1,
                    'user.nickname': 1,
                    'user.avatarUrl': 1,
                    'user.role': 1,
                    'user.verified': 1,
                },
            },
        ]).toArray();
        return NextResponse.json({
            comment: createdComment[0],
            message: 'Comment created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 