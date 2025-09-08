import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get all manga and count genres
        const manga = await db.collection('manga').find({}).toArray();

        const genreStats: Record<string, number> = {};

        manga.forEach(m => {
            if (m.genres && Array.isArray(m.genres)) {
                m.genres.forEach((genre: string) => {
                    genreStats[genre] = (genreStats[genre] || 0) + 1;
                });
            }
        });

        return NextResponse.json({
            stats: genreStats,
            totalGenres: Object.keys(genreStats).length
        });

    } catch (error) {
        console.error('Error fetching genre stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch genre stats' },
            { status: 500 }
        );
    }
}

