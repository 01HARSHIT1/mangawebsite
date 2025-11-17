import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch AI settings
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const aiSettings = await db.collection('ai_settings').findOne({ type: 'global' });

        return NextResponse.json({
            aiSettings: aiSettings || {
                type: 'global',
                recommendationEnabled: true,
                nsfwDetection: true,
                qualityChecks: true,
                autoTagging: false,
                ocrEnabled: false
            }
        });
    } catch (error) {
        console.error('Failed to fetch AI settings:', error);
        return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
    }
}

// PUT: Update AI settings
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { aiSettings } = body;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('ai_settings').updateOne(
            { type: 'global' },
            {
                $set: {
                    ...aiSettings,
                    type: 'global',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update AI settings:', error);
        return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
    }
}

