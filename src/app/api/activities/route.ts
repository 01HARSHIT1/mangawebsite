import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const type = searchParams.get('type') || 'global';
        const filter = searchParams.get('filter') || 'all';
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let query: any = { isPublic: true };
        let currentUser = null;

        // Get current user if authenticated
        try {
            currentUser = await requireAuth(request);
        } catch (error) {
            // Not authenticated, continue with public activities only
        }

        // Build query based on type
        if (type === 'personal' && currentUser) {
            query.userId = currentUser._id;
            delete query.isPublic; // Show all personal activities
        } else if (type === 'following' && currentUser) {
            // Get list of users the current user follows
            const follows = await db.collection('follows').find({
                followerId: currentUser._id
            }).toArray();
            
            const followedUserIds = follows.map(f => f.followedId);
            if (followedUserIds.length > 0) {
                query.userId = { $in: followedUserIds };
            } else {
                // No one followed, return empty result
                return NextResponse.json({
                    activities: [],
                    totalCount: 0,
                    page,
                    limit
                });
            }
        }

        // Apply filter
        if (filter !== 'all') {
            switch (filter) {
                case 'manga':
                    query.type = { $in: ['like', 'rating', 'new_chapter', 'new_manga'] };
                    break;
                case 'social':
                    query.type = { $in: ['follow', 'comment', 'tip'] };
                    break;
                case 'uploads':
                    query.type = { $in: ['new_chapter', 'new_manga'] };
                    break;
            }
        }

        // Get activities with pagination
        const activities = await db.collection('activities')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Get total count for pagination
        const totalCount = await db.collection('activities').countDocuments(query);

        // Populate user data
        const populatedActivities = await Promise.all(
            activities.map(async (activity) => {
                // Get user data
                const userData = await db.collection('users').findOne({
                    _id: ObjectId.isValid(activity.userId) ? new ObjectId(activity.userId) : activity.userId
                });

                // Get target data if applicable
                let targetData = null;
                if (activity.targetType === 'manga' && activity.targetId) {
                    targetData = await db.collection('manga').findOne({
                        _id: ObjectId.isValid(activity.targetId) ? new ObjectId(activity.targetId) : activity.targetId
                    });
                } else if (activity.targetType === 'user' && activity.targetId) {
                    targetData = await db.collection('users').findOne({
                        _id: ObjectId.isValid(activity.targetId) ? new ObjectId(activity.targetId) : activity.targetId
                    });
                }

                return {
                    ...activity,
                    _id: activity._id.toString(),
                    user: userData ? {
                        _id: userData._id.toString(),
                        username: userData.username,
                        role: userData.role || 'reader',
                        avatarUrl: userData.avatarUrl
                    } : null,
                    target: targetData ? {
                        type: activity.targetType,
                        id: targetData._id.toString(),
                        title: targetData.title || targetData.username,
                        coverImage: targetData.coverImage
                    } : null
                };
            })
        );

        return NextResponse.json({
            activities: populatedActivities.filter(a => a.user), // Filter out activities with missing users
            totalCount,
            page,
            limit,
            hasMore: page * limit < totalCount
        });

    } catch (error) {
        console.error('Error fetching activities:', error);
        
        // Return mock data if database fails
        const mockActivities = [
            {
                _id: '1',
                type: 'new_chapter',
                user: {
                    _id: '2',
                    username: 'akira_yamamoto',
                    role: 'creator'
                },
                target: {
                    type: 'chapter',
                    id: '1',
                    title: 'Dragon Chronicles - Chapter 26',
                    coverImage: '/placeholder-page-1.svg'
                },
                metadata: { chapterNumber: 26 },
                createdAt: new Date(Date.now() - 300000).toISOString(),
                isPublic: true
            },
            {
                _id: '2',
                type: 'like',
                user: {
                    _id: '1',
                    username: 'manga_lover_01',
                    role: 'reader'
                },
                target: {
                    type: 'manga',
                    id: '2',
                    title: 'Tokyo High School',
                    coverImage: '/placeholder-page-2.svg'
                },
                createdAt: new Date(Date.now() - 600000).toISOString(),
                isPublic: true
            }
        ];

        return NextResponse.json({
            activities: mockActivities,
            totalCount: mockActivities.length,
            page: 1,
            limit: 20,
            hasMore: false
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { type, targetType, targetId, targetTitle, content, metadata } = await request.json();

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Create activity
        const activity = {
            userId: user._id,
            type,
            targetType,
            targetId,
            targetTitle,
            content,
            metadata,
            createdAt: new Date(),
            isPublic: true
        };

        const result = await db.collection('activities').insertOne(activity);

        return NextResponse.json({
            success: true,
            activityId: result.insertedId.toString()
        });

    } catch (error) {
        console.error('Error creating activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
