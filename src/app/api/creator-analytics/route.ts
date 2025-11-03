import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 Creator Analytics API called');

        // Use the same authentication method as Dashboard API
        const user = await requireCreator(req);
        console.log('✅ User authenticated:', user._id, user.username, user.role);

    const client = await clientPromise;
    const db = client.db();
        
        console.log('🔍 Searching for manga with uploaderId:', user._id);
        
        // Use the same query method as Dashboard API - direct string match
        const series = await db.collection('manga')
            .find({ uploaderId: user._id })
            .sort({ createdAt: -1 })
            .toArray();
        console.log('📚 Found series with uploaderId:', series.length);
        console.log('📚 Series details:', series.map(s => ({ id: s._id, title: s.title, uploaderId: s.uploaderId })));

        // If no series found, return empty analytics but still valid data
        if (series.length === 0) {
            console.log('📊 No series found, returning empty analytics');
            return NextResponse.json({
                totalSeries: 0,
                totalEpisodes: 0,
                totalPages: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalRevenue: 0,
                totalMoneyGenerated: 0,
                totalEngagementRate: 0,
                growthRate: 0,
                MAU: 0,
                MPU: 0,
                payingRatio: 0,
                viewsOverTime: {},
                episodeViews: [],
                seriesEngagement: [],
                recentReads: [],
                detailedSeries: [],
                mostPopularSeries: null,
                mostPopularEpisode: null,
                viewsOver30Days: 0,
                topReaders: [],
                recentActivity: [],
                DAU: 0,
                totalSuperLikeRevenue: 0,
                episodeSuperLikeRevenue: 0,
                seriesSuperLikeRevenue: 0,
                CTR: 0,
                trafficSources: {},
                campaigns: {},
                cohorts: {}
            });
        }

        // Get all episodes for these series - use same approach as Dashboard API
        const episodes = await Promise.all(
            series.map(async (m) => {
                const chapters = await db.collection('chapters')
                    .find({ mangaId: m._id.toString() })
                    .toArray();
                return chapters;
            })
        ).then(results => results.flat());
        
    const seriesIds = series.map(s => s._id.toString());
        console.log('📚 Processing', series.length, 'series with', episodes.length, 'episodes');
        
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
        // Calculate total views and likes
        const totalViews = series.reduce((sum, s) => sum + (s.views || 0), 0) +
            episodes.reduce((sum, ep) => sum + (viewCounts[ep._id.toString()] || 0), 0);
        const totalLikes = series.reduce((sum, s) => sum + (Array.isArray(s.likes) ? s.likes.length : 0), 0) +
            episodes.reduce((sum, ep) => sum + (Array.isArray(ep.likes) ? ep.likes.length : 0), 0);

        // Calculate total revenue (example: $0.01 per view)
        const REVENUE_PER_VIEW = 0.01;
        const totalRevenue = totalViews * REVENUE_PER_VIEW;
        const totalMoneyGenerated = totalRevenue * 0.8; // Creator gets 80%

        // Enhanced series data with detailed metrics
        const detailedSeries = series.map(s => {
            const seriesViews = s.views || 0;
            const seriesLikes = Array.isArray(s.likes) ? s.likes.length : 0;
            const seriesRevenue = seriesViews * REVENUE_PER_VIEW;
            const seriesMoneyGenerated = seriesRevenue * 0.8;

            // Get chapters for this series
            const seriesChapters = episodes.filter(ep => ep.mangaId === s._id.toString());
            const chapterDetails = seriesChapters.map(chapter => {
                const chapterViews = viewCounts[chapter._id.toString()] || 0;
                const chapterLikes = Array.isArray(chapter.likes) ? chapter.likes.length : 0;
                const chapterRevenue = chapterViews * REVENUE_PER_VIEW;
                const chapterMoneyGenerated = chapterRevenue * 0.8;

                return {
                    _id: chapter._id.toString(),
                    chapterNumber: chapter.chapterNumber,
                    title: chapter.title || `Chapter ${chapter.chapterNumber}`,
                    views: chapterViews,
                    likes: chapterLikes,
                    revenue: chapterRevenue,
                    moneyGenerated: chapterMoneyGenerated,
                    createdAt: chapter.createdAt
                };
            });

            return {
                _id: s._id.toString(),
                title: s.title,
                coverImage: s.coverImage,
                views: seriesViews,
                likes: seriesLikes,
                revenue: seriesRevenue,
                moneyGenerated: seriesMoneyGenerated,
                chapters: chapterDetails,
                totalChapters: seriesChapters.length,
                createdAt: s.createdAt
            };
        });

        // Calculate additional metrics
        const totalComments = episodes.reduce((sum, ep) => sum + (Array.isArray(ep.comments) ? ep.comments.length : 0), 0);
        const totalEngagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

        // Calculate real growth rate based on historical data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get views from last 30 days vs previous 30 days
        const recentViews = users.reduce((sum, user) => {
            return sum + (user.readingHistory || []).filter((entry: any) => {
                if (!entry.timestamp) return false;
                const entryDate = new Date(entry.timestamp);
                return entryDate >= thirtyDaysAgo &&
                    (entry.mangaId && seriesIds.includes(entry.mangaId) ||
                        entry.chapterId && episodes.some(ep => ep._id.toString() === entry.chapterId));
            }).length;
        }, 0);

        const previousViews = users.reduce((sum, user) => {
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            return sum + (user.readingHistory || []).filter((entry: any) => {
                if (!entry.timestamp) return false;
                const entryDate = new Date(entry.timestamp);
                return entryDate >= sixtyDaysAgo && entryDate < thirtyDaysAgo &&
                    (entry.mangaId && seriesIds.includes(entry.mangaId) ||
                        entry.chapterId && episodes.some(ep => ep._id.toString() === entry.chapterId));
            }).length;
        }, 0);

        const growthRate = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0;

        // Enhanced detailed series with engagement rate
        const enhancedDetailedSeries = detailedSeries.map(s => {
            const totalChapterViews = s.chapters.reduce((sum, c) => sum + c.views, 0);
            const totalChapterLikes = s.chapters.reduce((sum, c) => sum + c.likes, 0);
            const totalChapterComments = episodes
                .filter(ep => ep.mangaId === s._id)
                .reduce((sum, ep) => sum + (Array.isArray(ep.comments) ? ep.comments.length : 0), 0);

            const seriesEngagementRate = (s.views + totalChapterViews) > 0
                ? ((s.likes + totalChapterLikes + totalChapterComments) / (s.views + totalChapterViews)) * 100
                : 0;

            // Add comments and engagement to chapters
            const enhancedChapters = s.chapters.map(c => {
                const chapterData = episodes.find(ep => ep._id.toString() === c._id);
                const comments = chapterData && Array.isArray(chapterData.comments) ? chapterData.comments.length : 0;
                const engagementRate = c.views > 0 ? ((c.likes + comments) / c.views) * 100 : 0;

                // Calculate real reading time and completion rate from user reading history
                const chapterReads = users.flatMap(user =>
                    (user.readingHistory || []).filter((entry: any) => entry.chapterId === c._id)
                );

                const completedReads = chapterReads.filter(entry => entry.completed);
                const completionRate = chapterReads.length > 0 ? Math.round((completedReads.length / chapterReads.length) * 100) : 0;

                // Calculate average reading time from entries with timestamps
                const readsWithTime = chapterReads.filter(entry => entry.timestamp && entry.endTimestamp);
                const avgReadTimeMs = readsWithTime.length > 0
                    ? readsWithTime.reduce((sum, entry) => {
                        const startTime = new Date(entry.timestamp).getTime();
                        const endTime = new Date(entry.endTimestamp).getTime();
                        return sum + (endTime - startTime);
                    }, 0) / readsWithTime.length
                    : 225000; // Default 3m 45s in milliseconds

                const avgReadTimeMinutes = Math.floor(avgReadTimeMs / 60000);
                const avgReadTimeSeconds = Math.floor((avgReadTimeMs % 60000) / 1000);
                const avgReadTimeFormatted = `${avgReadTimeMinutes}m ${avgReadTimeSeconds}s`;

                return {
                    ...c,
                    comments,
                    avgReadTime: avgReadTimeFormatted,
                    completionRate,
                    engagementRate,
                    status: chapterData?.status || 'published'
                };
            });

            const avgRating = seriesEngagement.find(se => se._id === s._id)?.avgRating || 0;

            return {
                ...s,
                comments: totalChapterComments,
                engagementRate: seriesEngagementRate,
                avgRating,
                chapters: enhancedChapters
            };
        });

        // Generate top performing chapters from real data
        const topPerformingChapters = enhancedDetailedSeries
            .flatMap(manga => manga.chapters.map(chapter => ({
                title: chapter.title,
                manga: manga.title,
                views: chapter.views,
                chapter: chapter.chapterNumber
            })))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        const responseData = {
        totalSeries: series.length,
        totalEpisodes: episodes.length,
        totalPages,
            totalViews,
            totalLikes,
            totalComments,
            totalRevenue,
            totalMoneyGenerated,
            totalEngagementRate,
            growthRate,
        mostPopularSeries,
        mostPopularEpisode,
        viewsOver30Days,
            topPerformingChapters,
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
            detailedSeries: enhancedDetailedSeries,
        };

        console.log('📊 Returning analytics data:', {
            totalSeries: responseData.totalSeries,
            totalEpisodes: responseData.totalEpisodes,
            totalViews: responseData.totalViews,
            totalLikes: responseData.totalLikes,
            detailedSeriesCount: responseData.detailedSeries.length
        });

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('❌ Creator Analytics API Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 