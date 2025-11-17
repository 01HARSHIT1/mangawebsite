import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


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

        // Check if this is admin email trying to login through regular login
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
        
        // If admin credentials, allow login but ensure they have admin role
        let user;
        if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
            const client = await clientPromise;
            const db = client.db();
            
            // Find or create admin user
            let adminUser = await db.collection('users').findOne({ 
                email: ADMIN_EMAIL.toLowerCase(),
                role: 'admin'
            });
            
            if (!adminUser) {
                // Create admin user if it doesn't exist
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                const now = new Date();
                const result = await db.collection('users').insertOne({
                    email: ADMIN_EMAIL.toLowerCase(),
                    username: process.env.ADMIN_USERNAME || 'admin',
                    password: hashedPassword,
                    role: 'admin',
                    isCreator: true,
                    isVerified: true,
                    createdAt: now,
                    updatedAt: now,
                    lastLogin: now,
                    failedLoginAttempts: 0,
                    accountLocked: false,
                    coins: 0
                });
                adminUser = await db.collection('users').findOne({ _id: result.insertedId });
            } else {
                // Verify password
                const bcrypt = require('bcryptjs');
                const isValidPassword = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
                if (!isValidPassword) {
                    // Update password if env var changed
                    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                    await db.collection('users').updateOne(
                        { _id: adminUser._id },
                        { $set: { password: hashedPassword, lastLogin: new Date() } }
                    );
                } else {
                    await db.collection('users').updateOne(
                        { _id: adminUser._id },
                        { $set: { lastLogin: new Date() } }
                    );
                }
            }
            
            if (adminUser) {
                user = {
                    _id: adminUser._id.toString(),
                    email: adminUser.email,
                    username: adminUser.username || process.env.ADMIN_USERNAME || 'admin',
                    role: 'admin',
                    isCreator: true,
                    createdAt: adminUser.createdAt,
                    updatedAt: adminUser.updatedAt
                };
            }
        } else {
            // Regular user authentication
            user = await authenticateUser(email, password);
        }
        
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