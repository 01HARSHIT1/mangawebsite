import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: Get user statistics and achievements
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    if (!params.userId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    try {
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection('users');
        // Get the user
        const user = await users.findOne({ _id: new ObjectId(params.userId) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        // Calculate stats
        const readingHistory = user.readingHistory || [];
        const bookmarks = user.bookmarks || [];
        const followers = user.followers || [];
        const following = user.following || [];
        const likes = user.likes || [];
        const comments = user.comments || [];
        const coins = user.coins || 0;
        // Calculate reading streak (consecutive days with reading activity)
        const readingStreak = calculateReadingStreak(readingHistory);
        // Calculate achievements based on user activity
        const achievements = calculateAchievements({
            readingHistory,
            bookmarks,
            followers,
            following,
            likes,
            comments,
            coins,
            role: user.role,
            readingStreak,
        });
        // Get recent activity (last 10 reading activities)
        const recentActivity = readingHistory
            .slice(0, 10)
            .map((entry: any) => ({
                type: entry.chapterId ? 'read' : 'view',
                description: entry.chapterId
                    ? `Read chapter ${entry.chapterNumber || 'N/A'} of ${entry.mangaTitle || 'Unknown'}`
                    : `Viewed ${entry.mangaTitle || 'Unknown'}`,
                timestamp: entry.timestamp,
                mangaId: entry.mangaId,
                chapterId: entry.chapterId,
            }));
        const stats = {
            totalReads: readingHistory.length,
            totalBookmarks: bookmarks.length,
            totalLikes: likes.length,
            totalComments: comments.length,
            readingStreak,
            followers: followers.length,
            following: following.length,
            coins,
            achievements,
            recentActivity,
        };
        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to calculate reading streak
function calculateReadingStreak(readingHistory: any[]) {
    if (!readingHistory || readingHistory.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = new Set<number>();
    readingHistory.forEach((entry: any) => {
        if (entry.timestamp) {
            const date = new Date(entry.timestamp);
            date.setHours(0, 0, 0, 0);
            dates.add(date.getTime());
        }
    });
    const sortedDates = Array.from(dates).sort((a, b) => b - a);
    let streak = 0;
    let currentDate = today.getTime();
    for (const date of sortedDates) {
        const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            streak++;
            currentDate = date;
        } else {
            break;
        }
    }
    return streak;
}

// Helper function to calculate achievements
function calculateAchievements(userData: any) {
    const achievements: string[] = [];
    // First read achievement
    if (userData.readingHistory.length > 0) {
        achievements.push('first_read');
    }
    // First like achievement
    if (userData.likes.length > 0) {
        achievements.push('first_like');
    }
    // First comment achievement
    if (userData.comments.length > 0) {
        achievements.push('first_comment');
    }
    // Reading streak achievement (7+ days)
    if (userData.readingStreak >= 7) {
        achievements.push('reading_streak');
    }
    // Bookmark master achievement (50 bookmarks)
    if (userData.bookmarks.length >= 50) {
        achievements.push('bookmark_master');
    }
    // Social butterfly achievement (10 following)
    if (userData.following.length >= 10) {
        achievements.push('social_butterfly');
    }
    // Top reader achievement (100 reads)
    if (userData.readingHistory.length >= 100) {
        achievements.push('top_reader');
    }
    // Premium member achievement (has coins or creator/admin role)
    if (userData.coins > 0 || userData.role === 'creator' || userData.role === 'admin') {
        achievements.push('premium_member');
    }
    return achievements;
} 