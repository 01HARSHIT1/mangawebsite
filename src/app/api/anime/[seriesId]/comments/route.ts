import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// GET - Fetch comments for an anime series
export async function GET(
    request: NextRequest,
    { params }: { params: { seriesId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'best'; // best, newest, oldest
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const client = await clientPromise;
        const db = client.db();

        // Build sort query
        let sortQuery: any = {};
        if (sort === 'newest') {
            sortQuery = { createdAt: -1 };
        } else if (sort === 'oldest') {
            sortQuery = { createdAt: 1 };
        } else {
            // Best: sort by likes count (upvotes - downvotes)
            sortQuery = { likesCount: -1, createdAt: -1 };
        }

        // Fetch comments with user details
        const comments = await db.collection('anime_comments').aggregate([
            { $match: { seriesId: params.seriesId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    likesCount: { $subtract: [{ $size: { $ifNull: ['$upvotes', []] } }, { $size: { $ifNull: ['$downvotes', []] } }] },
                },
            },
            { $sort: sortQuery },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    seriesId: 1,
                    userId: 1,
                    username: 1,
                    text: 1,
                    isSpoiler: 1,
                    upvotes: 1,
                    downvotes: 1,
                    likesCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'user.username': 1,
                    'user.email': 1,
                    'user._id': 1,
                },
            },
        ]).toArray();

        // Get total count
        const totalCount = await db.collection('anime_comments').countDocuments({ seriesId: params.seriesId });

        return NextResponse.json({
            comments: comments.map(comment => ({
                ...comment,
                _id: comment._id.toString(),
                userId: comment.userId?.toString(),
                createdAt: comment.createdAt?.toISOString(),
                updatedAt: comment.updatedAt?.toISOString(),
            })),
            total: totalCount,
        });
    } catch (error) {
        console.error('Error fetching anime comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST - Add a new comment (login required)
export async function POST(
    request: NextRequest,
    { params }: { params: { seriesId: string } }
) {
    try {
        // Check authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default-secret-key';

        let userId: string;
        let username: string;

        try {
            const decoded = jwt.verify(token, secret) as any;
            userId = decoded.userId || decoded.id;

            // Fetch user from database
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            username = user.username || user.email?.split('@')[0] || 'Anonymous';
        } catch (err) {
            console.error('Error verifying token:', err);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { text, isSpoiler = false } = body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Verify series exists
        const series = await db.collection('anime_series').findOne({ _id: new ObjectId(params.seriesId) });
        if (!series) {
            return NextResponse.json({ error: 'Anime series not found' }, { status: 404 });
        }

        // Create comment document
        const commentDoc = {
            seriesId: params.seriesId,
            userId: new ObjectId(userId),
            username: username,
            text: text.trim(),
            isSpoiler: !!isSpoiler, // Mark comment as spoiler if requested
            upvotes: [],
            downvotes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('anime_comments').insertOne(commentDoc);

        // Return the created comment
        const createdComment = {
            ...commentDoc,
            _id: result.insertedId.toString(),
            userId: userId,
            createdAt: commentDoc.createdAt.toISOString(),
            updatedAt: commentDoc.updatedAt.toISOString(),
        };

        return NextResponse.json({ comment: createdComment }, { status: 201 });
    } catch (error) {
        console.error('Error creating anime comment:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
}

