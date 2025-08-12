import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Input validation schema
const loginSchema = z.object({
    username: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(1, 'Password is required'),
});

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

function isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (!attempts) {
        loginAttempts.set(identifier, { count: 1, lastAttempt: now });
        return false;
    }

    // Check if account is locked
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > windowMs) {
        loginAttempts.set(identifier, { count: 1, lastAttempt: now });
        return false;
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;

    // Lock account if too many attempts
    if (attempts.count >= maxAttempts) {
        attempts.lockedUntil = now + (30 * 60 * 1000); // Lock for 30 minutes
        return true;
    }

    return false;
}

function clearRateLimit(identifier: string): void {
    loginAttempts.delete(identifier);
}

export async function POST(req: NextRequest) {
    try {
        console.log('=== LOGIN API CALLED ===');
        const body = await req.json();
        console.log('Login request body:', body);

        // Validate input
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            console.log('Login validation failed:', validationResult.error.errors);
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { username, email, password } = validationResult.data;
        console.log('Login validated data:', { username, email });

        // Check if at least one identifier is provided
        if (!username && !email) {
            console.log('Login failed: No username or email provided');
            return NextResponse.json(
                { error: 'Username or email is required' },
                { status: 400 }
            );
        }

        // Rate limiting check
        const clientIP = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
        const identifier = email || username || clientIP;

        if (isRateLimited(identifier)) {
            console.log('Login failed: Rate limited');
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again in 30 minutes.' },
                { status: 429 }
            );
        }

        console.log('Login: Connecting to MongoDB...');
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection('users');

        // Find user by email or username
        let user;
        if (email) {
            user = await users.findOne({ email: email.toLowerCase() });
            console.log('Login: Searching for user by email:', email.toLowerCase());
        } else if (username) {
            user = await users.findOne({ nickname: username.toLowerCase() });
            console.log('Login: Searching for user by username:', username.toLowerCase());
        }

        if (!user) {
            console.log('Login failed: User not found');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        console.log('Login: User found:', { id: user._id, email: user.email, nickname: user.nickname });

        // Check if account is locked
        if (user.accountLocked) {
            const lockExpiry = user.lockExpiry;
            if (lockExpiry && new Date() < new Date(lockExpiry)) {
                return NextResponse.json(
                    { error: 'Account is temporarily locked due to too many failed attempts' },
                    { status: 423 }
                );
            } else {
                // Unlock account if lock has expired
                await users.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            accountLocked: false,
                            failedLoginAttempts: 0,
                            lockExpiry: null
                        }
                    }
                );
            }
        }

        // Check if account is verified (for non-admin users)
        if (user.role !== 'admin' && !user.isVerified) {
            return NextResponse.json(
                { error: 'Please verify your email address before logging in' },
                { status: 403 }
            );
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const updateData: any = { failedLoginAttempts: newFailedAttempts };

            // Lock account after 5 failed attempts
            if (newFailedAttempts >= 5) {
                updateData.accountLocked = true;
                updateData.lockExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }

            await users.updateOne({ _id: user._id }, { $set: updateData });

            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Clear rate limiting on successful login
        clearRateLimit(identifier);

        // Reset failed login attempts and unlock account
        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    failedLoginAttempts: 0,
                    accountLocked: false,
                    lockExpiry: null,
                    lastLogin: new Date()
                }
            }
        );

        // Create JWT with enhanced security
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.nickname,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            JWT_SECRET,
            {
                expiresIn: '7d',
                issuer: 'manga-website',
                audience: 'manga-users'
            }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const response = {
            success: true,
            token,
            refreshToken,
            role: user.role,
            user: {
                id: user._id.toString(),
                nickname: user.nickname,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        };

        console.log('Login successful, returning response:', {
            success: response.success,
            userId: response.user.id,
            nickname: response.user.nickname,
            role: response.user.role,
            tokenLength: response.token.length
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again later.' },
            { status: 500 }
        );
    }
} 