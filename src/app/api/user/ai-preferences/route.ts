import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { DEFAULT_AI_PREFERENCES, UserAIPreferences } from '@/lib/ai-features-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch user AI preferences
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get user AI preferences
        const userDoc = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return preferences or defaults
        const preferences: Partial<UserAIPreferences> = userDoc.aiPreferences || {};
        const mergedPreferences = {
            ...DEFAULT_AI_PREFERENCES,
            ...preferences,
            userId: userId.toString()
        };

        return NextResponse.json({ preferences: mergedPreferences });
    } catch (error) {
        console.error('Error fetching AI preferences:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AI preferences' },
            { status: 500 }
        );
    }
}

// PUT: Update user AI preferences
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { preferences } = body;

        if (!preferences || typeof preferences !== 'object') {
            return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Update user AI preferences
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    aiPreferences: {
                        ...preferences,
                        updatedAt: new Date()
                    }
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'AI preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating AI preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update AI preferences' },
            { status: 500 }
        );
    }
}

