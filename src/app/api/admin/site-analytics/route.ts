import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();
    const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
    });

    // Get all data
    const [users, manga, chapters, payments, reports] = await Promise.all([
        db.collection('users').find({}).toArray(),
        db.collection('manga').find({}).toArray(),
        db.collection('chapters').find({}).toArray(),
        db.collection('payments').find({}).toArray(),
        db.collection('reports').find({}).toArray()
    ]);

    // Calculate metrics
    const totalUsers = users.length;
    const totalManga = manga.length;
    const totalChapters = chapters.length;
    const totalPages = chapters.reduce((sum, ch) => sum + (Array.isArray(ch.pages) ? ch.pages.length : 0), 0);

    // User metrics
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const bannedUsers = users.filter(u => u.isBanned).length;
    const creators = users.filter(u => u.role === 'creator').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const viewers = users.filter(u => u.role === 'viewer').length;

    // Revenue metrics
    const totalRevenue = payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    const monthlyRevenue = payments
        .filter(p => p.timestamp && new Date(p.timestamp) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);

    // Engagement metrics
    const totalViews = users.reduce((sum, u) => sum + (Array.isArray(u.readingHistory) ? u.readingHistory.length : 0), 0);
    const totalLikes = manga.reduce((sum, m) => sum + (Array.isArray(m.likes) ? m.likes.length : 0), 0);
    const totalComments = chapters.reduce((sum, ch) => sum + (Array.isArray(ch.comments) ? ch.comments.length : 0), 0);

    // DAU/MAU calculation
    const today = now.toISOString().slice(0, 10);
    const last30Set = new Set(last30);
    const dauSet = new Set();
    const mauSet = new Set();
    users.forEach(u => {
        (u.readingHistory || []).forEach((entry: any) => {
            if (entry.timestamp) {
                const day = new Date(entry.timestamp).toISOString().slice(0, 10);
                if (day === today) dauSet.add(u._id.toString());
                if (last30Set.has(day)) mauSet.add(u._id.toString());
            }
        });
    });

    // Views over time
    const viewsOverTime: { [date: string]: number } = {};
    users.forEach(u => {
        (u.readingHistory || []).forEach((entry: any) => {
            if (entry.timestamp) {
                const day = new Date(entry.timestamp).toISOString().slice(0, 10);
                if (last30.includes(day)) {
                    viewsOverTime[day] = (viewsOverTime[day] || 0) + 1;
                }
            }
        });
    });

    // Content moderation
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const rejectedReports = reports.filter(r => r.status === 'rejected').length;

    // Top content
    const topManga = manga
        .map(m => ({
            _id: m._id.toString(),
            title: m.title,
            views: Array.isArray(m.likes) ? m.likes.length : 0,
            likes: Array.isArray(m.likes) ? m.likes.length : 0,
            creator: users.find(u => u._id.toString() === m.uploaderId)?.nickname || 'Unknown'
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

    const topCreators = users
        .filter(u => u.role === 'creator')
        .map(u => {
            const creatorManga = manga.filter(m => m.uploaderId === u._id.toString());
            const totalViews = creatorManga.reduce((sum, m) => sum + (Array.isArray(m.likes) ? m.likes.length : 0), 0);
            return {
                _id: u._id.toString(),
                nickname: u.nickname || u.email,
                mangaCount: creatorManga.length,
                totalViews,
                isVerified: u.isVerified
            };
        })
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, 10);

    return NextResponse.json({
        overview: {
            totalUsers,
            totalManga,
            totalChapters,
            totalPages,
            totalRevenue,
            monthlyRevenue,
            totalViews,
            totalLikes,
            totalComments
        },
        users: {
            verified: verifiedUsers,
            banned: bannedUsers,
            creators,
            admins,
            viewers,
            dau: dauSet.size,
            mau: mauSet.size
        },
        moderation: {
            pendingReports,
            resolvedReports,
            rejectedReports,
            totalReports: reports.length
        },
        viewsOver30Days: last30.map(day => ({ day, views: viewsOverTime[day] || 0 })),
        topManga,
        topCreators
    });
} 