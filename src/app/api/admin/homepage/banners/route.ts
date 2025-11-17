import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all banners
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

        const banners = await db.collection('homepage_banners')
            .find({})
            .sort({ order: 1 })
            .toArray();

        return NextResponse.json({
            banners: banners.map(b => ({
                ...b,
                _id: b._id.toString()
            }))
        });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }
}

// POST: Create new banner
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { title, imageUrl, linkUrl, order, isActive, startDate, endDate } = body;

        if (!title || !imageUrl || !linkUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const banner = {
            title,
            imageUrl,
            linkUrl,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('homepage_banners').insertOne(banner);

        return NextResponse.json({
            success: true,
            banner: { ...banner, _id: result.insertedId.toString() }
        });
    } catch (error) {
        console.error('Failed to create banner:', error);
        return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
    }
}

// PUT: Update banner
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const update: any = {
            ...updateData,
            updatedAt: new Date()
        };

        if (updateData.startDate) update.startDate = new Date(updateData.startDate);
        if (updateData.endDate) update.endDate = new Date(updateData.endDate);

        const result = await db.collection('homepage_banners').updateOne(
            { _id: new ObjectId(_id) },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update banner:', error);
        return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
    }
}

// DELETE: Delete banner
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const bannerId = searchParams.get('id');

        if (!bannerId) {
            return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const result = await db.collection('homepage_banners').deleteOne({ _id: new ObjectId(bannerId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete banner:', error);
        return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
    }
}

