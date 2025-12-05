import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * Creator Onboarding Service
 * Handles creator signup, KYC verification, and profile creation
 */

export const dynamic = 'force-dynamic';

interface CreatorSignupRequest {
    displayName: string;
    bio?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        youtube?: string;
        instagram?: string;
    };
    kycDocuments?: {
        identityType: 'passport' | 'drivers_license' | 'national_id';
        documentUrl: string;
    };
}

// POST /api/creators/signup - Create creator profile
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body: CreatorSignupRequest = await request.json();
        const { displayName, bio, website, socialLinks, kycDocuments } = body;

        if (!displayName || displayName.trim().length < 2) {
            return NextResponse.json(
                { error: 'Display name must be at least 2 characters' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get user
        const user = await db.collection('users').findOne({ 
            _id: new ObjectId(payload.userId) 
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if creator profile already exists
        const existingCreator = await db.collection('creators').findOne({ 
            userId: payload.userId 
        });

        if (existingCreator) {
            return NextResponse.json(
                { error: 'Creator profile already exists', creatorId: existingCreator._id },
                { status: 400 }
            );
        }

        // Create creator profile
        const creatorProfile = {
            userId: payload.userId,
            displayName: displayName.trim(),
            bio: bio || '',
            website: website || '',
            socialLinks: socialLinks || {},
            kycStatus: kycDocuments ? 'pending' : 'not_required', // 'not_required' | 'pending' | 'verified' | 'rejected'
            kycDocuments: kycDocuments ? [kycDocuments] : [],
            verificationStatus: 'unverified', // 'unverified' | 'verified' | 'rejected'
            payoutAccountId: null,
            earnings: {
                total: 0,
                pending: 0,
                paid: 0,
                currency: 'INR',
            },
            stats: {
                totalUploads: 0,
                totalViews: 0,
                totalSubscribers: 0,
            },
            settings: {
                notifications: true,
                emailUpdates: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('creators').insertOne(creatorProfile);
        const creatorId = result.insertedId.toString();

        // Update user role to creator
        await db.collection('users').updateOne(
            { _id: new ObjectId(payload.userId) },
            {
                $set: {
                    role: 'creator',
                    isCreator: true,
                    creatorId: creatorId,
                    updatedAt: new Date(),
                },
            }
        );

        // If KYC documents provided, create moderation task
        if (kycDocuments) {
            await db.collection('moderation_tasks').insertOne({
                type: 'kyc_verification',
                creatorId: creatorId,
                userId: payload.userId,
                status: 'pending',
                priority: 'high',
                documents: kycDocuments,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            creatorId: creatorId,
            kycStatus: creatorProfile.kycStatus,
            message: kycDocuments 
                ? 'Creator profile created. KYC verification pending.' 
                : 'Creator profile created successfully.',
        });
    } catch (error: any) {
        console.error('Creator signup error:', error);
        return NextResponse.json(
            { error: 'Failed to create creator profile', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/creators/signup - Get creator profile status
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const creator = await db.collection('creators').findOne({ 
            userId: payload.userId 
        });

        if (!creator) {
            return NextResponse.json({ 
                isCreator: false,
                message: 'No creator profile found' 
            });
        }

        return NextResponse.json({
            isCreator: true,
            creatorId: creator._id.toString(),
            displayName: creator.displayName,
            kycStatus: creator.kycStatus,
            verificationStatus: creator.verificationStatus,
            earnings: creator.earnings,
            stats: creator.stats,
        });
    } catch (error: any) {
        console.error('Get creator status error:', error);
        return NextResponse.json(
            { error: 'Failed to get creator status' },
            { status: 500 }
        );
    }
}



