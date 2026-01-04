import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const day = searchParams.get('day'); // Optional: filter by specific day

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get anime with air dates
        // For now, we'll use anime with status 'ongoing' and sort by release date
        const scheduledAnime = await db.collection('anime_series')
            .find({ 
                status: 'ongoing',
                // You can add airDate field to anime_series collection
            })
            .sort({ releaseDate: 1, createdAt: -1 })
            .limit(50)
            .toArray();

        // Group by day of week (mock implementation - you'll need to add airDate/airTime to your schema)
        const scheduleByDay: Record<string, any[]> = {
            'Sunday': [],
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': [],
        };

        scheduledAnime.forEach((anime, index) => {
            // Mock: distribute across days for demo
            const days = Object.keys(scheduleByDay);
            const dayIndex = index % 7;
            const dayName = days[dayIndex];
            
            // Mock air time
            const hour = 20 + (index % 4); // 20-23 (8-11 PM)
            const minute = (index * 15) % 60;
            
            scheduleByDay[dayName].push({
                _id: anime._id.toString(),
                title: anime.title,
                coverImage: anime.coverImage,
                airTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                status: anime.status || 'ongoing',
                episodeCount: anime.episodeCount || 0,
            });
        });

        if (day) {
            return NextResponse.json({ 
                day,
                anime: scheduleByDay[day] || []
            });
        }

        return NextResponse.json({ schedule: scheduleByDay });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ schedule: {} });
    }
}

