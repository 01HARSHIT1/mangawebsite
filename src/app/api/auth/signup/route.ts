import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Input validation schema
const signupSchema = z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(128, 'Password must be less than 128 characters'),
    nickname: z.string()
        .min(2, 'Nickname must be at least 2 characters')
        .max(20, 'Nickname must be less than 20 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Nickname can only contain letters, numbers, underscores, and hyphens'),
    role: z.enum(['viewer', 'creator']).optional().default('viewer'),
});

export async function POST(req: NextRequest) {
    try {
        console.log('=== SIGNUP API CALLED ===');

        const body = await req.json();
        console.log('Request body:', body);

        // Validate input
        const validationResult = signupSchema.safeParse(body);
        if (!validationResult.success) {
            console.log('Validation failed:', validationResult.error.errors);
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { email, password, nickname, role } = validationResult.data;
        console.log('Validated data:', { email, nickname, role });

        let client;
        try {
            client = await clientPromise;
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            return NextResponse.json(
                { error: 'Database connection failed. Please try again later.' },
                { status: 503 }
            );
        }

        const db = client.db();
        const users = db.collection('users');

        // Check total users in database
        const totalUsers = await users.countDocuments();
        console.log('Total users in database:', totalUsers);

        // Check if user/email/nickname already exists with case-insensitive search
        const existingEmail = await users.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        const existingNickname = await users.findOne({
            nickname: { $regex: new RegExp(`^${nickname}$`, 'i') }
        });

        console.log('Checking for existing users:', {
            email: email,
            nickname: nickname,
            existingEmail: existingEmail ? existingEmail.email : null,
            existingNickname: existingNickname ? existingNickname.nickname : null
        });

        if (existingEmail) {
            console.log('Email already exists:', existingEmail.email);
            return NextResponse.json(
                { error: `Email "${email}" is already registered. Please use a different email address.` },
                { status: 409 }
            );
        }

        if (existingNickname) {
            console.log('Nickname already exists:', existingNickname.nickname);
            return NextResponse.json(
                { error: `Nickname "${nickname}" is already taken. Please choose a different username.` },
                { status: 409 }
            );
        }

        console.log('No existing users found, proceeding with user creation...');

        // Hash password with higher cost factor
        const hash = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = {
            email: email.toLowerCase(),
            password: hash,
            nickname: nickname.toLowerCase(),
            role: role || 'viewer',
            isVerified: true, // Set to true for testing
            verificationToken,
            verificationExpiry,
            createdAt: new Date(),
            lastLogin: new Date(),
            failedLoginAttempts: 0,
            accountLocked: false,
            coins: 0
        };

        const result = await users.insertOne(newUser);
        const userId = result.insertedId;

        // Create JWT with enhanced security
        const token = jwt.sign(
            {
                userId: userId,
                username: newUser.nickname,
                email: newUser.email,
                role: newUser.role,
                isVerified: newUser.isVerified
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
            { userId: userId, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Return user data without sensitive information
        const userData = {
            id: userId.toString(),
            nickname: newUser.nickname,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified
        };

        console.log('User created successfully');
        console.log('User ID:', userId);
        console.log('User data:', userData);

        return NextResponse.json({
            success: true,
            message: 'Account created successfully. Please log in to continue.',
            user: userData
        });

    } catch (error) {
        console.error('=== SIGNUP ERROR ===');
        console.error('Signup error:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'Internal server error. Please try again later.', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 