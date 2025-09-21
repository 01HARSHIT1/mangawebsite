import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: Get user's following list
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const skip = (page - 1) * limit;
    if (!params.userId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    try {
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection('users');
        // Get the user to find their following
        const user = await users.findOne({ _id: new ObjectId(params.userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const following = user.following || [];
        const totalFollowing = following.length;
        // Get following details with pagination
        const followingDetails = await users
            .find({ _id: { $in: following.map((id: string) => new ObjectId(id)) } })
            .project({
                _id: 1,
                nickname: 1,
                username: 1,
                avatarUrl: 1,
                role: 1,
                verified: 1,
                bio: 1,
                createdAt: 1,
            })
            .sort({ nickname: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        return NextResponse.json({
            following: followingDetails,
            pagination: {
                page,
                limit,
                total: totalFollowing,
                totalPages: Math.ceil(totalFollowing / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 