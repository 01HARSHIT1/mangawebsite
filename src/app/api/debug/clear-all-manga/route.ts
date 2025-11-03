import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * DANGER: This endpoint deletes ALL manga and chapters from the database
 * Use only for development/testing purposes
 */
export async function POST(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Delete all chapters first (to avoid orphaned chapters)
        const chaptersResult = await db.collection('chapters').deleteMany({});
        console.log(`🗑️  Deleted ${chaptersResult.deletedCount} chapters`);

        // Delete all manga
        const mangaResult = await db.collection('manga').deleteMany({});
        console.log(`🗑️  Deleted ${mangaResult.deletedCount} manga`);

        return NextResponse.json({
            success: true,
            message: 'Database cleared successfully',
            deleted: {
                manga: mangaResult.deletedCount,
                chapters: chaptersResult.deletedCount
            }
        });

    } catch (error) {
        console.error('❌ Error clearing database:', error);
        return NextResponse.json({
            error: 'Failed to clear database',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

