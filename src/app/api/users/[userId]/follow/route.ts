import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const user = await requireAuth(request);
        const targetUserId = params.userId;

        if (user._id === targetUserId) {
            return NextResponse.json(
                { error: 'Cannot follow yourself' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Check if target user exists
        const targetUser = await db.collection('users').findOne({
            _id: ObjectId.isValid(targetUserId) ? new ObjectId(targetUserId) : targetUserId
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already following
        const existingFollow = await db.collection('follows').findOne({
            followerId: user._id,
            followedId: targetUserId
        });

        if (existingFollow) {
            return NextResponse.json(
                { error: 'Already following this user' },
                { status: 400 }
            );
        }

        // Create follow relationship
        await db.collection('follows').insertOne({
            followerId: user._id,
            followedId: targetUserId,
            followerUsername: user.username,
            followedUsername: targetUser.username,
            createdAt: new Date()
        });

        // Update follower counts
        await Promise.all([
            db.collection('users').updateOne(
                { _id: user._id },
                { $inc: { followingCount: 1 } }
            ),
            db.collection('users').updateOne(
                { _id: ObjectId.isValid(targetUserId) ? new ObjectId(targetUserId) : targetUserId },
                { $inc: { followerCount: 1 } }
            )
        ]);

        // Create activity log
        await db.collection('activities').insertOne({
            userId: user._id,
            type: 'follow',
            targetType: 'user',
            targetId: targetUserId,
            targetTitle: targetUser.username,
            createdAt: new Date(),
            isPublic: true
        });

        // Create notification for followed user
        await db.collection('notifications').insertOne({
            userId: targetUserId,
            type: 'follow',
            title: 'New Follower',
            message: `${user.username} started following you`,
            data: {
                fromUser: user.username,
                fromUserId: user._id
            },
            read: false,
            createdAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: `Now following ${targetUser.username}`
        });

    } catch (error) {
        console.error('Error following user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const user = await requireAuth(request);
        const targetUserId = params.userId;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Remove follow relationship
        const deleteResult = await db.collection('follows').deleteOne({
            followerId: user._id,
            followedId: targetUserId
        });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Not following this user' },
                { status: 400 }
            );
        }

        // Update follower counts
        await Promise.all([
            db.collection('users').updateOne(
                { _id: user._id },
                { $inc: { followingCount: -1 } }
            ),
            db.collection('users').updateOne(
                { _id: ObjectId.isValid(targetUserId) ? new ObjectId(targetUserId) : targetUserId },
                { $inc: { followerCount: -1 } }
            )
        ]);

        return NextResponse.json({
            success: true,
            message: 'Unfollowed successfully'
        });

    } catch (error) {
        console.error('Error unfollowing user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
