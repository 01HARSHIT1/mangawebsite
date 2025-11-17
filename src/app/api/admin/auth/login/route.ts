import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin credentials - these should be set in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

/**
 * Secure admin-only login endpoint
 * Only allows login with specific admin credentials
 */
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

        // Check if this is the admin email
        if (!ADMIN_EMAIL || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        // Verify admin password
        if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

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
                username: ADMIN_USERNAME,
                password: hashedPassword,
                role: 'admin',
                isCreator: true, // Admin can also act as creator
                isVerified: true,
                createdAt: now,
                updatedAt: now,
                lastLogin: now,
                failedLoginAttempts: 0,
                accountLocked: false,
                coins: 0
            });

            adminUser = await db.collection('users').findOne({ 
                _id: result.insertedId 
            });
        } else {
            // Verify password for existing admin account
            const bcrypt = require('bcryptjs');
            const isValidPassword = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
            
            if (!isValidPassword) {
                // If password doesn't match, update it (in case env var changed)
                const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                await db.collection('users').updateOne(
                    { _id: adminUser._id },
                    { 
                        $set: { 
                            password: hashedPassword,
                            lastLogin: new Date(),
                            failedLoginAttempts: 0,
                            accountLocked: false
                        } 
                    }
                );
            } else {
                // Update last login
                await db.collection('users').updateOne(
                    { _id: adminUser._id },
                    { 
                        $set: { 
                            lastLogin: new Date(),
                            failedLoginAttempts: 0,
                            accountLocked: false
                        } 
                    }
                );
            }
        }

        if (!adminUser) {
            return NextResponse.json(
                { error: 'Failed to create admin account' },
                { status: 500 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: adminUser._id.toString(),
            email: adminUser.email,
            role: 'admin',
            isCreator: true,
        });

        // Log admin login
        await db.collection('admin_logs').insertOne({
            adminId: adminUser._id,
            adminEmail: adminUser.email,
            action: 'admin_login',
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({
            message: 'Admin login successful',
            user: {
                _id: adminUser._id.toString(),
                email: adminUser.email,
                username: adminUser.username || ADMIN_USERNAME,
                role: 'admin',
                isCreator: true,
                createdAt: adminUser.createdAt,
            },
            token,
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Admin login failed' },
            { status: 500 }
        );
    }
}

