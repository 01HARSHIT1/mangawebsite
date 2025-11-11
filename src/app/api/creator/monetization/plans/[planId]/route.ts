import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth, requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeUpdates(body: any) {
    if (!body || typeof body !== 'object') {
        return {};
    }

    const update: any = {};

    if (body.name && typeof body.name === 'string') {
        update.name = body.name.trim();
    }

    if (typeof body.description === 'string') {
        update.description = body.description.trim();
    }

    if (body.price !== undefined) {
        const price = Number(body.price);
        if (Number.isNaN(price) || price < 0) {
            const error = new Error('INVALID_PRICE');
            throw error;
        }
        update.price = price;
    }

    if (body.interval && typeof body.interval === 'string') {
        const allowed = ['one-time', 'monthly', 'quarterly', 'yearly'];
        if (!allowed.includes(body.interval)) {
            const error = new Error('INVALID_INTERVAL');
            throw error;
        }
        update.interval = body.interval;
    }

    if (body.type && typeof body.type === 'string') {
        const allowedTypes = ['subscription', 'one-time', 'coins'];
        if (!allowedTypes.includes(body.type)) {
            const error = new Error('INVALID_TYPE');
            throw error;
        }
        update.type = body.type;
    }

    if (Array.isArray(body.perks)) {
        update.perks = body.perks.filter((perk) => typeof perk === 'string').slice(0, 20);
    }

    if (body.isActive !== undefined) {
        update.isActive = Boolean(body.isActive);
    }

    if (body.razorpayPlanId !== undefined) {
        update.razorpayPlanId = typeof body.razorpayPlanId === 'string'
            ? body.razorpayPlanId.trim()
            : null;
    }

    return update;
}

export async function GET(request: NextRequest, { params }: { params: { planId: string } }) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        if (!ObjectId.isValid(params.planId)) {
            return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });
        }

        const plan = await db.collection('monetization_plans').findOne({
            _id: new ObjectId(params.planId),
            creatorId: user._id.toString()
        });

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            plan: {
                _id: plan._id.toString(),
                name: plan.name,
                description: plan.description || '',
                price: plan.price || 0,
                interval: plan.interval || 'monthly',
                type: plan.type || 'subscription',
                perks: plan.perks || [],
                isActive: plan.isActive !== false,
                subscriberCount: plan.subscriberCount || 0,
                razorpayPlanId: plan.razorpayPlanId || null,
                createdAt: plan.createdAt,
                updatedAt: plan.updatedAt
            }
        });
    } catch (error) {
        console.error('Fetch monetization plan error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load monetization plan',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { planId: string } }) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        if (!ObjectId.isValid(params.planId)) {
            return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });
        }

        const updates = sanitizeUpdates(await request.json());

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        updates.updatedAt = new Date();

        const result = await db.collection('monetization_plans').findOneAndUpdate(
            {
                _id: new ObjectId(params.planId),
                creatorId: user._id.toString()
            },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const plan = result.value;

        return NextResponse.json({
            success: true,
            plan: {
                _id: plan._id.toString(),
                name: plan.name,
                description: plan.description || '',
                price: plan.price || 0,
                interval: plan.interval || 'monthly',
                type: plan.type || 'subscription',
                perks: plan.perks || [],
                isActive: plan.isActive !== false,
                subscriberCount: plan.subscriberCount || 0,
                razorpayPlanId: plan.razorpayPlanId || null,
                createdAt: plan.createdAt,
                updatedAt: plan.updatedAt
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            if (['INVALID_PRICE', 'INVALID_INTERVAL', 'INVALID_TYPE'].includes(error.message)) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
        }

        console.error('Update monetization plan error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update monetization plan',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        if (!ObjectId.isValid(params.planId)) {
            return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });
        }

        const result = await db.collection('monetization_plans').deleteOne({
            _id: new ObjectId(params.planId),
            creatorId: user._id.toString()
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete monetization plan error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete monetization plan',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

