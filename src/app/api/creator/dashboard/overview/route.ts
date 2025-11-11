import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret-key';

    try {
        const decoded = jwt.verify(token, secret) as any;
        const userId = decoded.userId || decoded.id;

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        return user;
    } catch (err) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isCreator) {
            return NextResponse.json({ error: 'Not a creator' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d';

        const client = await clientPromise;
        const db = client.db();

        // Calculate date range
        const now = new Date();
        const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // Fetch creator's manga
        const manga = await db.collection('manga')
            .find({ uploaderId: user._id.toString() })
            .toArray();

        const mangaIds = manga.map(m => m._id.toString());

        // Fetch chapters
        const chapters = await db.collection('chapters')
            .find({ mangaId: { $in: mangaIds } })
            .toArray();

        // Calculate total views and likes
        const totalViews = manga.reduce((sum, m) => sum + (m.views || 0), 0);
        const totalLikes = manga.reduce((sum, m) => sum + (m.likes || 0), 0);

        // Calculate views for the period (mock data for now - implement view tracking later)
        const views30d = Math.round(totalViews * 0.6); // Approximate 60% of total views in last 30d
        const viewsChange = Math.round(Math.random() * 20 - 5); // Mock change percentage

        // Fetch donations/revenue (from donations collection)
        const donations = await db.collection('donations')
            .find({ 
                recipientId: user._id.toString(),
                createdAt: { $gte: startDate }
            })
            .toArray();

        const revenue30d = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // Calculate total balance (all-time donations)
        const allDonations = await db.collection('donations')
            .find({ recipientId: user._id.toString() })
            .toArray();
        
        const currentBalance = allDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

        // Mock subscribers data (implement proper subscriber tracking later)
        const newSubscribers7d = Math.round(totalViews * 0.02);
        const newSubscribers30d = Math.round(totalViews * 0.05);

        // Calculate average read time (mock for now)
        const avgReadTime = chapters.length > 0 ? Math.round(chapters.length * 5.5) : 0;

        // Get top performing series
        const topSeries = manga
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3)
            .map(m => ({
                _id: m._id.toString(),
                title: m.title,
                views: m.views || 0,
                revenue: Math.round((m.views || 0) * 0.1), // Mock revenue calculation
                coverImage: typeof m.coverImage === 'string' ? m.coverImage : m.coverImage?.secure_url || '/placeholder.svg'
            }));

        // Mock pending moderation
        const pendingModeration = 0;

        const kpiData = {
            currentBalance: Math.round(currentBalance * 100) / 100,
            views30d,
            viewsChange,
            newSubscribers7d,
            newSubscribers30d,
            revenue30d: Math.round(revenue30d * 100) / 100,
            revenueChange: Math.round(Math.random() * 30 - 10), // Mock
            totalManga: manga.length,
            totalChapters: chapters.length,
            totalLikes,
            avgReadTime,
            topSeries,
            pendingModeration
        };

        return NextResponse.json(kpiData);

    } catch (error) {
        console.error('Error fetching overview data:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch overview data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

