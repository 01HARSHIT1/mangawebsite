import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'changeme');
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = payload.userId || payload._id || payload.id;
    const client = await clientPromise;
    const db = client.db();
    // Get all series by this creator
    const series = await db.collection('manga').find({ uploaderId: userId }).toArray();
    const seriesIds = series.map(s => s._id.toString());
    // Get all episodes for these series
    const episodes = await db.collection('chapters').find({ mangaId: { $in: seriesIds } }).toArray();
    // Count total pages
    const totalPages = episodes.reduce((sum, ep) => sum + (Array.isArray(ep.pages) ? ep.pages.length : 0), 0);
    // Get all users' readingHistory
    const users = await db.collection('users').find({}).toArray();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
    const viewCounts: { [id: string]: number } = {};
    const viewsOverTime: { [date: string]: number } = {};
    const readerCounts: { [userId: string]: number } = {};
    const recentReads: any[] = [];
    const now = new Date();
    const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
    });
    users.forEach(u => {
        (u.readingHistory || []).forEach((entry: any) => {
            // Only count if it's for this creator's content
            if (entry.mangaId && seriesIds.includes(entry.mangaId)) {
                viewCounts[entry.mangaId] = (viewCounts[entry.mangaId] || 0) + 1;
                // Views over time
                if (entry.timestamp) {
                    const day = new Date(entry.timestamp).toISOString().slice(0, 10);
                    if (last30.includes(day)) viewsOverTime[day] = (viewsOverTime[day] || 0) + 1;
                }
                // Top readers
                readerCounts[u._id.toString()] = (readerCounts[u._id.toString()] || 0) + 1;
                // Recent activity
                if (entry.timestamp) recentReads.push({ ...entry, userId: u._id.toString(), timestamp: entry.timestamp });
            }
            if (entry.chapterId && episodes.some(ep => ep._id.toString() === entry.chapterId)) {
                viewCounts[entry.chapterId] = (viewCounts[entry.chapterId] || 0) + 1;
                if (entry.timestamp) {
                    const day = new Date(entry.timestamp).toISOString().slice(0, 10);
                    if (last30.includes(day)) viewsOverTime[day] = (viewsOverTime[day] || 0) + 1;
                }
                readerCounts[u._id.toString()] = (readerCounts[u._id.toString()] || 0) + 1;
                if (entry.timestamp) recentReads.push({ ...entry, userId: u._id.toString(), timestamp: entry.timestamp });
            }
        });
    });
    // Most popular series
    let mostPopularSeries = null;
    if (series.length) {
        const maxSeries = series.reduce((a, b) => (viewCounts[a._id.toString()] || 0) > (viewCounts[b._id.toString()] || 0) ? a : b);
        mostPopularSeries = { title: maxSeries.title, views: viewCounts[maxSeries._id.toString()] || 0 };
    }
    // Most popular episode
    let mostPopularEpisode = null;
    if (episodes.length) {
        const maxEp = episodes.reduce((a, b) => (viewCounts[a._id.toString()] || 0) > (viewCounts[b._id.toString()] || 0) ? a : b);
        mostPopularEpisode = { title: maxEp.chapterNumber || maxEp.title, views: viewCounts[maxEp._id.toString()] || 0 };
    }
    // Top readers with avatar/nickname
    const topReaders = Object.entries(readerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({
            userId,
            views: count,
            nickname: userMap[userId]?.nickname || '',
            avatarUrl: userMap[userId]?.avatarUrl || '',
        }));
    // Recent activity (last 10 reads, with avatar/nickname)
    recentReads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = recentReads.slice(0, 10).map(a => ({
        ...a,
        nickname: userMap[a.userId]?.nickname || '',
        avatarUrl: userMap[a.userId]?.avatarUrl || '',
    }));
    // Views over last 30 days (fill missing days with 0)
    const viewsOver30Days = last30.map(day => ({ day, views: viewsOverTime[day] || 0 }));
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
    const DAU = dauSet.size;
    const MAU = mauSet.size;
    // MPU and Paying Ratio
    const payments = await db.collection('payments').find({ timestamp: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }).toArray();
    const payingUserSet = new Set(payments.map((p: any) => p.userId?.toString()).filter(Boolean));
    const MPU = payingUserSet.size;
    const payingRatio = MAU > 0 ? Math.round((MPU / MAU) * 10000) / 100 : 0; // percent, 2 decimals
    // Episode views list (sortable)
    const episodeViews = episodes.map(ep => {
        const epId = ep._id.toString();
        // Gather all readingHistory entries for this episode
        const entries = users.flatMap(u => (u.readingHistory || []).filter((e: any) => e.chapterId === epId));
        // Time spent: only consider entries with endTimestamp
        const timeEntries = entries.filter(e => e.endTimestamp && e.timestamp);
        const avgTimeSpent = timeEntries.length > 0 ? Math.round(timeEntries.reduce((sum, e) => sum + (new Date(e.endTimestamp).getTime() - new Date(e.timestamp).getTime()), 0) / timeEntries.length / 1000) : 0;
        // Completion rate: entries with completed true
        const completedCount = entries.filter(e => e.completed).length;
        const completionRate = entries.length > 0 ? Math.round((completedCount / entries.length) * 100) : 0;
        // Ratings
        let avgRating = 0;
        if (Array.isArray(ep.ratings) && ep.ratings.length > 0) {
            avgRating = Math.round((ep.ratings.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) / ep.ratings.length) * 100) / 100;
        }
        return {
            _id: epId,
            title: ep.title || ep.chapterNumber || '',
            chapterNumber: ep.chapterNumber,
            views: viewCounts[epId] || 0,
            likes: Array.isArray(ep.likes) ? ep.likes.length : 0,
            comments: Array.isArray(ep.comments) ? ep.comments.length : 0,
            avgTimeSpent,
            completionRate,
            avgRating,
        };
    }).sort((a, b) => b.views - a.views);
    // Series engagement list
    const seriesEngagement = series.map(s => {
        let avgRating = 0;
        if (Array.isArray(s.ratings) && s.ratings.length > 0) {
            avgRating = Math.round((s.ratings.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) / s.ratings.length) * 100) / 100;
        }
        return {
            _id: s._id.toString(),
            title: s.title,
            subscribers: Array.isArray(s.subscribers) ? s.subscribers.length : 0,
            likes: Array.isArray(s.likes) ? s.likes.length : 0,
            avgRating,
        };
    }).sort((a, b) => b.subscribers - a.subscribers);
    // Super Like Revenue Metrics
    const superLikePayments = payments.filter((p: any) => p.type === 'superlike');
    const totalSuperLikeRevenue = superLikePayments.reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    // Per-episode revenue
    const episodeSuperLikeRevenue = episodes.map(ep => ({
        _id: ep._id.toString(),
        title: ep.title || ep.chapterNumber || '',
        revenue: superLikePayments.filter((p: any) => p.episodeId === ep._id.toString()).reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0),
    }));
    // Per-series revenue
    const seriesSuperLikeRevenue = series.map(s => ({
        _id: s._id.toString(),
        title: s.title,
        revenue: superLikePayments.filter((p: any) => p.mangaId === s._id.toString()).reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0),
    }));
    // Campaign Effectiveness Analytics
    // CTR: users with a campaign/source in readingHistory divided by total users
    const usersWithCampaign = users.filter(u => (u.readingHistory || []).some(e => e.campaign || e.source));
    const CTR = users.length > 0 ? Math.round((usersWithCampaign.length / users.length) * 10000) / 100 : 0; // percent, 2 decimals
    // Traffic Source breakdown
    const sourceCounts: { [source: string]: number } = {};
    const campaignCounts: { [campaign: string]: number } = {};
    users.forEach(u => (u.readingHistory || []).forEach(e => {
        if (e.source) sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
        if (e.campaign) campaignCounts[e.campaign] = (campaignCounts[e.campaign] || 0) + 1;
    }));
    // Cohort analysis: group users by cohort and count their reading activity
    const cohortCounts: { [cohort: string]: number } = {};
    users.forEach(u => (u.readingHistory || []).forEach(e => {
        if (e.cohort) cohortCounts[e.cohort] = (cohortCounts[e.cohort] || 0) + 1;
    }));
    return NextResponse.json({
        totalSeries: series.length,
        totalEpisodes: episodes.length,
        totalPages,
        mostPopularSeries,
        mostPopularEpisode,
        viewsOver30Days,
        topReaders,
        recentActivity,
        DAU,
        MAU,
        MPU,
        payingRatio,
        episodeViews,
        seriesEngagement,
        totalSuperLikeRevenue,
        episodeSuperLikeRevenue,
        seriesSuperLikeRevenue,
        CTR,
        trafficSources: sourceCounts,
        campaigns: campaignCounts,
        cohorts: cohortCounts,
    });
} 