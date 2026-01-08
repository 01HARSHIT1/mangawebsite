import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Default anime playback preferences
const DEFAULT_PREFERENCES = {
    autoPlay: false,
    autoNext: false,
    autoSkip: false,
    introStartTime: 0,
    introEndTime: 0,
    outroStartTime: 0,
    outroEndTime: 0,
    defaultAudioLanguage: null as string | null,
    defaultAudioTrack: null as string | null, // languageCode for preferred audio track
    defaultSubtitleLanguage: null as string | null,
    playbackSpeed: 1,
    defaultPlaybackSpeed: 1, // Preferred playback speed (0.5, 0.75, 1, 1.25, 1.5, 2)
    volume: 1,
    keyboardShortcutsEnabled: true,
    updatedAt: new Date(),
};

// GET: Fetch user anime preferences
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            // Return default preferences for unauthenticated users
            return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const preferences = user?.animePreferences || DEFAULT_PREFERENCES;

        return NextResponse.json({ preferences });
    } catch (error) {
        console.error('Error fetching anime preferences:', error);
        return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
    }
}

// PUT: Update user anime preferences
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
        const updates = body.preferences || body;

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get existing preferences
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const existingPreferences = user?.animePreferences || DEFAULT_PREFERENCES;

        // Merge with existing preferences
        const updatedPreferences = {
            ...DEFAULT_PREFERENCES,
            ...existingPreferences,
            ...updates,
            updatedAt: new Date(),
        };

        // Update user preferences
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    animePreferences: updatedPreferences,
                },
            }
        );

        return NextResponse.json({
            success: true,
            preferences: updatedPreferences,
            message: 'Preferences updated successfully',
        });
    } catch (error) {
        console.error('Error updating anime preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}

