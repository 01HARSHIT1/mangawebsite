import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Authenticate user
        const user = await authenticateUser(email, password);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: user._id,
            email: user.email,
            role: user.role,
            isCreator: user.isCreator,
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                isCreator: user.isCreator,
                creatorProfile: user.creatorProfile,
                createdAt: user.createdAt,
            },
            token,
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}