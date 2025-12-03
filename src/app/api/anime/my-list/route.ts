import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Get user's My List
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const listType = searchParams.get('type') || 'favorites';

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const myList = await db.collection('anime_my_list')
            .find({ 
                userId: payload.userId,
                listType: listType,
            })
            .sort({ addedAt: -1 })
            .toArray();

        return NextResponse.json({ 
            myList: myList.map((item: any) => ({
                _id: item._id.toString(),
                seriesId: item.seriesId,
                listType: item.listType,
                addedAt: item.addedAt,
            })),
            total: myList.length 
        });
    } catch (error) {
        console.error('Error fetching my list:', error);
        return NextResponse.json({ error: 'Failed to fetch my list' }, { status: 500 });
    }
}

// Add to My List
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { seriesId, listType = 'favorites' } = body;

        if (!seriesId) {
            return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
        }

        const validTypes = ['favorites', 'watchlist', 'watching', 'completed', 'dropped', 'on_hold'];
        if (!validTypes.includes(listType)) {
            return NextResponse.json({ error: 'Invalid list type' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const now = new Date();
        await db.collection('anime_my_list').updateOne(
            {
                userId: payload.userId,
                seriesId: seriesId,
                listType: listType,
            },
            {
                $set: {
                    updatedAt: now,
                },
                $setOnInsert: {
                    userId: payload.userId,
                    seriesId,
                    listType,
                    addedAt: now,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Added to my list' });
    } catch (error) {
        console.error('Error adding to my list:', error);
        return NextResponse.json({ error: 'Failed to add to my list' }, { status: 500 });
    }
}

// Remove from My List
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const listType = searchParams.get('listType') || 'favorites';

        if (!seriesId) {
            return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('anime_my_list').deleteOne({
            userId: payload.userId,
            seriesId: seriesId,
            listType: listType,
        });

        return NextResponse.json({ success: true, message: 'Removed from my list' });
    } catch (error) {
        console.error('Error removing from my list:', error);
        return NextResponse.json({ error: 'Failed to remove from my list' }, { status: 500 });
    }
}

