import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        return NextResponse.json({
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            isCreator: user.isCreator,
            creatorProfile: user.creatorProfile,
            createdAt: user.createdAt,
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }
}

