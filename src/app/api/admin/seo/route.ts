import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch SEO settings
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

        const seoSettings = await db.collection('seo_settings').findOne({ type: 'global' });

        return NextResponse.json({
            seoSettings: seoSettings || {
                type: 'global',
                siteTitle: 'Manga Website',
                siteDescription: 'Read and discover amazing manga',
                siteKeywords: 'manga, comics, reading',
                ogImage: '',
                canonicalUrl: ''
            }
        });
    } catch (error) {
        console.error('Failed to fetch SEO settings:', error);
        return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
    }
}

// PUT: Update SEO settings
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
        const { seoSettings } = body;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('seo_settings').updateOne(
            { type: 'global' },
            {
                $set: {
                    ...seoSettings,
                    type: 'global',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update SEO settings:', error);
        return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
    }
}

