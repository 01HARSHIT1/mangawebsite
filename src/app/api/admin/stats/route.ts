import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

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
        // Get current date for today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Fetch all stats in parallel
        const [
            totalUsers,
            totalManga,
            totalChapters,
            totalComments,
            newUsersToday,
            newMangaToday,
            totalReports,
            pendingReports,
            activeUsers,
            storageStats,
        ] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('manga').countDocuments({ status: { $ne: 'removed' } }),
            db.collection('chapters').countDocuments({ status: { $ne: 'removed' } }),
            db.collection('comments').countDocuments({ status: { $ne: 'removed' } }),
            db.collection('users').countDocuments({ createdAt: { $gte: today } }),
            db.collection('manga').countDocuments({ createdAt: { $gte: today }, status: { $ne: 'removed' } }),
            db.collection('reports').countDocuments(),
            db.collection('reports').countDocuments({ status: 'pending' }),
            db.collection('users').countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            Promise.resolve({ used: 2.4 * 1024 * 1024 * 1024, total: 10 * 1024 * 1024 * 1024 }), // 2.4GB used, 10GB total
        ]);
        // Calculate system health based on various metrics
        let systemHealth: 'good' | 'warning' | 'critical' = 'good';
        // Check for critical issues
        if (pendingReports > 50 || totalReports > 100) {
            systemHealth = 'critical';
        } else if (pendingReports > 20 || totalReports > 50) {
            systemHealth = 'warning';
        }
        // Check storage usage
        const storageUsagePercent = (storageStats.used / storageStats.total) * 100;
        if (storageUsagePercent > 90) {
            systemHealth = 'critical';
        } else if (storageUsagePercent > 75) {
            systemHealth = 'warning';
        }
        // Check user activity
        const activeUserPercent = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        if (activeUserPercent < 5 && totalUsers > 10) {
            systemHealth = 'warning';
        }
        const stats = {
            totalUsers,
            totalManga,
            totalChapters,
            totalComments,
            activeUsers,
            newUsersToday,
            newMangaToday,
            totalReports,
            pendingReports,
            systemHealth,
            storageUsed: storageStats.used,
            storageTotal: storageStats.total,
            activeUserPercent: Math.round(activeUserPercent * 100) / 100,
            storageUsagePercent: Math.round(storageUsagePercent * 100) / 100,
        };
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 