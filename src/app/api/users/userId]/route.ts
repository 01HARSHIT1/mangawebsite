import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Get specific user profile
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    if (!params.userId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    try {
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection('users');
        // Get the user
        const user = await users.findOne({ _id: new ObjectId(params.userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        // Check if current user is following this user
        let isFollowing = false;
        const auth = req.headers.get('authorization');
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
                const currentUserId = payload.userId;
                if (currentUserId && currentUserId !== params.userId) {
                    const currentUser = await users.findOne({ _id: new ObjectId(currentUserId) });
                    if (currentUser && currentUser.following) {
                        isFollowing = currentUser.following.includes(params.userId);
                    }
                }
            } catch (error) {
                // Invalid token, but we can still return user data
                console.log('Invalid token when checking follow status');
            }
        }
        // Return safe user data (exclude sensitive fields)
        const safeUser = {
            _id: user._id,
            nickname: user.nickname,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            role: user.role,
            verified: user.verified,
            createdAt: user.createdAt,
            followers: user.followers || [],
            following: user.following || [],
        };
        return NextResponse.json({ user: safeUser, isFollowing });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 