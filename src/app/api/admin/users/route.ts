import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const { db } = await connectToDatabase();
    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { nickname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await db.collection('users')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
    // Get total count
    const total = await db.collection('users').countDocuments(filter);
    // Get report counts for users
    const reportCounts = await db.collection('reports')
      .aggregate([
        { $group: { _id: '$reporterId', count: { $sum: 1 } } },
      ]).toArray();
    const reportCountMap = new Map();
    reportCounts.forEach(item => {
      reportCountMap.set(item._id?.toString(), item.count);
    });
    // Add report counts to users
    const usersWithReports = users.map(user => ({
      ...user,
      reportCount: reportCountMap.get(user._id?.toString()) || 0,
    }));
    return NextResponse.json({
      users: usersWithReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 