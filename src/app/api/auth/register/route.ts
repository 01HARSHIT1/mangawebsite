import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, username, password } = await request.json();

        // Validate input
        if (!email || !username || !password) {
            return NextResponse.json(
                { error: 'Email, username, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Create user
        const user = await createUser(email, username, password);

        // Generate token
        const token = generateToken({
            userId: user._id,
            email: user.email,
            role: user.role,
            isCreator: user.isCreator,
        });

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                isCreator: user.isCreator,
                createdAt: user.createdAt,
            },
            token,
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Registration failed' },
            { status: 400 }
        );
    }
}

