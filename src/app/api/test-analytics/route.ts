import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        console.log('🧪 Test Analytics API called');

        // Return a simple test response with all required fields
        const testData = {
            totalSeries: 1,
            totalEpisodes: 1,
            totalPages: 10,
            totalViews: 100,
            totalLikes: 50,
            totalRevenue: 1.00,
            totalMoneyGenerated: 0.80,
            MAU: 25,
            MPU: 5,
            payingRatio: 0.2,
            viewsOverTime: {},
            episodeViews: [],
            seriesEngagement: [],
            recentReads: [],
            detailedSeries: [{
                _id: 'test-manga-1',
                title: 'Test Manga',
                coverImage: '/placeholder-cover.jpg',
                views: 100,
                likes: 50,
                revenue: 1.00,
                moneyGenerated: 0.80,
                totalChapters: 1,
                chapters: [{
                    _id: 'test-chapter-1',
                    chapterNumber: 1,
                    title: 'Chapter 1',
                    views: 100,
                    likes: 50,
                    revenue: 1.00,
                    moneyGenerated: 0.80,
                    createdAt: new Date().toISOString()
                }],
                createdAt: new Date().toISOString()
            }],
            mostPopularSeries: null,
            mostPopularEpisode: null,
            viewsOver30Days: 100,
            topReaders: [],
            recentActivity: [],
            DAU: 10,
            totalSuperLikeRevenue: 0,
            episodeSuperLikeRevenue: 0,
            seriesSuperLikeRevenue: 0,
            CTR: 0.05,
            trafficSources: {},
            campaigns: {},
            cohorts: {},
            message: 'Test analytics data - API is working!'
        };

        console.log('✅ Test analytics data returned');
        return NextResponse.json(testData);

    } catch (error) {
        console.error('❌ Test Analytics API Error:', error);
        return NextResponse.json({
            error: 'Test API failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
