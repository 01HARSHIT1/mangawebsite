import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all promo codes
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

        const promoCodes = await db.collection('promo_codes')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            promoCodes: promoCodes.map(p => ({
                ...p,
                _id: p._id.toString(),
                validUntil: p.validUntil ? p.validUntil.toISOString() : null
            }))
        });
    } catch (error) {
        console.error('Failed to fetch promo codes:', error);
        return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
    }
}

// POST: Create new promo code
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
        const { code, discount, type, validUntil, isActive } = body;

        if (!code || !discount || !type || !validUntil) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['percentage', 'fixed'].includes(type)) {
            return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Check if code already exists
        const existing = await db.collection('promo_codes').findOne({ code: code.toUpperCase() });
        if (existing) {
            return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
        }

        const promoCode = {
            code: code.toUpperCase(),
            discount: parseFloat(discount),
            type,
            validUntil: new Date(validUntil),
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('promo_codes').insertOne(promoCode);

        return NextResponse.json({
            success: true,
            promoCode: { ...promoCode, _id: result.insertedId.toString(), validUntil: promoCode.validUntil.toISOString() }
        });
    } catch (error) {
        console.error('Failed to create promo code:', error);
        return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
    }
}

// PUT: Update promo code
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
            return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const update: any = {
            updatedAt: new Date()
        };

        if (updateData.discount !== undefined) update.discount = parseFloat(updateData.discount);
        if (updateData.validUntil) update.validUntil = new Date(updateData.validUntil);
        if (updateData.isActive !== undefined) update.isActive = updateData.isActive;

        const result = await db.collection('promo_codes').updateOne(
            { _id: new ObjectId(_id) },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update promo code:', error);
        return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
    }
}

// DELETE: Delete promo code
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
        const promoId = searchParams.get('id');

        if (!promoId) {
            return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const result = await db.collection('promo_codes').deleteOne({ _id: new ObjectId(promoId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete promo code:', error);
        return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
    }
}

