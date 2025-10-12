import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({
                error: 'Missing or invalid token',
                isCreator: false,
                isAuthenticated: false
            }, { status: 401 });
        }

        const token = auth.replace('Bearer ', '');
        let payload: any;

        try {
            payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
        } catch (error) {
            return NextResponse.json({
                error: 'Invalid token',
                isCreator: false,
                isAuthenticated: false
            }, { status: 401 });
        }

        const userId = payload.userId || payload._id || payload.id;

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection('users').findOne({
            _id: typeof userId === 'string' ? new ObjectId(userId) : userId
        });

        if (!user) {
            return NextResponse.json({
                error: 'User not found',
                isCreator: false,
                isAuthenticated: false
            }, { status: 404 });
        }

        return NextResponse.json({
            isAuthenticated: true,
            isCreator: user.role === 'creator' || user.role === 'admin',
            userRole: user.role,
            userId: user._id.toString(),
            username: user.username,
            message: user.role === 'creator' || user.role === 'admin'
                ? '✅ User is a creator/admin'
                : '❌ User is NOT a creator (role: ' + user.role + ')'
        });

    } catch (error) {
        console.error('❌ Check creator status error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            isCreator: false,
            isAuthenticated: false
        }, { status: 500 });
    }
}

