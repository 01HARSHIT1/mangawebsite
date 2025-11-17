import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all coin packages
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

        const packages = await db.collection('coin_packages')
            .find({})
            .sort({ coins: 1 })
            .toArray();

        return NextResponse.json({
            packages: packages.map(p => ({
                ...p,
                _id: p._id.toString()
            }))
        });
    } catch (error) {
        console.error('Failed to fetch coin packages:', error);
        return NextResponse.json({ error: 'Failed to fetch coin packages' }, { status: 500 });
    }
}

// POST: Create new coin package
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
        const { name, coins, price, bonus, isActive } = body;

        if (!name || !coins || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const packageData = {
            name,
            coins: parseInt(coins),
            price: parseFloat(price),
            bonus: bonus ? parseInt(bonus) : 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('coin_packages').insertOne(packageData);

        return NextResponse.json({
            success: true,
            package: { ...packageData, _id: result.insertedId.toString() }
        });
    } catch (error) {
        console.error('Failed to create coin package:', error);
        return NextResponse.json({ error: 'Failed to create coin package' }, { status: 500 });
    }
}

// PUT: Update coin package
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
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const update: any = {
            ...updateData,
            updatedAt: new Date()
        };

        if (updateData.coins) update.coins = parseInt(updateData.coins);
        if (updateData.price) update.price = parseFloat(updateData.price);
        if (updateData.bonus !== undefined) update.bonus = parseInt(updateData.bonus);

        const result = await db.collection('coin_packages').updateOne(
            { _id: new ObjectId(_id) },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update coin package:', error);
        return NextResponse.json({ error: 'Failed to update coin package' }, { status: 500 });
    }
}

// DELETE: Delete coin package
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
        const packageId = searchParams.get('id');

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const result = await db.collection('coin_packages').deleteOne({ _id: new ObjectId(packageId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete coin package:', error);
        return NextResponse.json({ error: 'Failed to delete coin package' }, { status: 500 });
    }
}

