import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Super admin bootstrap credentials (for first-time setup only)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@mangawebsite.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!Secure';
const SUPER_ADMIN_BOOTSTRAP = process.env.SUPER_ADMIN_BOOTSTRAP === 'true';

/**
 * Secure admin-only login endpoint
 * Supports:
 * 1. Bootstrap super admin (first run only, via ENV)
 * 2. Database-based admin users (normal operation)
 * 3. Password hashing with bcrypt
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

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Try to find admin user in database
        let adminUser = await db.collection('users').findOne({ 
            email: email.toLowerCase(),
            role: 'admin'
        });

        // If no admin user found and bootstrap is enabled, create super admin
        if (!adminUser && SUPER_ADMIN_BOOTSTRAP) {
            // Verify bootstrap credentials
            if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && 
                password === SUPER_ADMIN_PASSWORD) {
                
                const { hashPassword } = await import('@/lib/auth');
                const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
                
                const now = new Date();
                const result = await db.collection('users').insertOne({
                    email: SUPER_ADMIN_EMAIL.toLowerCase(),
                    username: process.env.SUPER_ADMIN_USERNAME || 'admin',
                    password: hashedPassword,
                    role: 'admin',
                    isCreator: true,
                    isVerified: true,
                    isSuperAdmin: true, // Mark as super admin
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

                console.log('✅ Super admin created via bootstrap');
            } else {
                return NextResponse.json(
                    { error: 'Invalid admin credentials' },
                    { status: 401 }
                );
            }
        } else if (!adminUser) {
            // No admin user found and bootstrap disabled
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        } else {
            // Admin user exists - verify password
            const { verifyPassword } = await import('@/lib/auth');
            const isValidPassword = await verifyPassword(password, adminUser.password);
            
            if (!isValidPassword) {
                // Check if this is bootstrap attempt (only if bootstrap enabled)
                if (SUPER_ADMIN_BOOTSTRAP && 
                    email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && 
                    password === SUPER_ADMIN_PASSWORD) {
                    // Update password from bootstrap credentials
                    const { hashPassword } = await import('@/lib/auth');
                    const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
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
                    // Increment failed login attempts
                    await db.collection('users').updateOne(
                        { _id: adminUser._id },
                        { 
                            $inc: { failedLoginAttempts: 1 },
                            $set: { updatedAt: new Date() }
                        }
                    );
                    
                    return NextResponse.json(
                        { error: 'Invalid admin credentials' },
                        { status: 401 }
                    );
                }
            } else {
                // Valid password - update last login
                await db.collection('users').updateOne(
                    { _id: adminUser._id },
                    { 
                        $set: { 
                            lastLogin: new Date(),
                            failedLoginAttempts: 0,
                            accountLocked: false,
                            updatedAt: new Date()
                        } 
                    }
                );
            }
        }

        if (!adminUser) {
            return NextResponse.json(
                { error: 'Failed to authenticate admin account' },
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

        // Log admin login (audit trail)
        await db.collection('admin_audit_logs').insertOne({
            adminId: adminUser._id.toString(),
            adminEmail: adminUser.email,
            action: 'admin_login',
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            success: true
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

