import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Admin: Update user (suspend, ban, activate, promote, demote)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { action } = body;
    if (!action || !['suspend', 'ban', 'activate', 'promote', 'demote'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    // Get the target user
    const targetUser = await db.collection('users').findOne({ _id: params.userId });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Prevent admin from modifying themselves
    if (targetUser._id.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }
    let updateData: any = {};
    let notificationMessage = '';
    switch (action) {
      case 'suspend':
        updateData = {
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedBy: user._id,
        };
        notificationMessage = 'Your account has been suspended by an administrator.';
        break;
      case 'ban':
        updateData = {
          status: 'banned',
          bannedAt: new Date(),
          bannedBy: user._id,
        };
        notificationMessage = 'Your account has been banned by an administrator.';
        break;
      case 'activate':
        updateData = {
          status: 'active',
          suspendedAt: null,
          suspendedBy: null,
          bannedAt: null,
          bannedBy: null,
        };
        notificationMessage = 'Your account has been reactivated by an administrator.';
        break;
      case 'promote':
        if (targetUser.role === 'admin') {
          return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
        }
        updateData = {
          role: 'admin',
          promotedAt: new Date(),
          promotedBy: user._id,
        };
        notificationMessage = 'You have been promoted to administrator by an administrator.';
        break;
      case 'demote':
        if (targetUser.role !== 'admin') {
          return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }
        updateData = {
          role: 'viewer',
          demotedAt: new Date(),
          demotedBy: user._id,
        };
        notificationMessage = 'You have been demoted from administrator by an administrator.';
        break;
    }
    // Update user
    await db.collection('users').updateOne(
      { _id: params.userId },
      { $set: updateData }
    );
    // Send notification to user
    const notification = {
      userId: params.userId,
      type: 'account_update',
      title: 'Account Update',
      message: notificationMessage,
      data: {
        action: action,
        performedBy: user._id,
        performedAt: new Date(),
      },
      createdAt: new Date(),
      read: false,
    };
    await db.collection('notifications').insertOne(notification);
    // Log admin action
    const adminLog = {
      adminId: user._id,
      adminEmail: user.email,
      targetUserId: params.userId,
      targetUserEmail: targetUser.email,
      action: action,
      timestamp: new Date(),
      details: updateData,
    };
    await db.collection('admin_logs').insertOne(adminLog);
    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin: Get user details and stats
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    const targetUser = await db.collection('users').findOne({ _id: params.userId });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Get user's report count
    const reportCount = await db.collection('reports').countDocuments({ reporterId: params.userId });
    // Get user's activity stats
    const userStats = await db.collection('users').aggregate([
      { $match: { _id: targetUser._id } },
      {
        $lookup: {
          from: 'manga',
          localField: '_id',
          foreignField: 'uploaderId',
          as: 'uploadedManga',
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'userId',
          as: 'comments',
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          nickname: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          lastLogin: 1,
          avatarUrl: 1,
          verified: 1,
          uploadedMangaCount: { $size: '$uploadedManga' },
          commentsCount: { $size: '$comments' },
        },
      },
    ]).toArray();
    const userWithStats = userStats[0] || targetUser;
    userWithStats.reportCount = reportCount;
    return NextResponse.json({ user: userWithStats });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 