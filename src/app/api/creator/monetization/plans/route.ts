import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_INTERVALS = ['one-time', 'monthly', 'quarterly', 'yearly'] as const;
const VALID_TYPES = ['subscription', 'one-time', 'coins'] as const;

type PlanInterval = (typeof VALID_INTERVALS)[number];
type PlanType = (typeof VALID_TYPES)[number];

function validatePlanPayload(body: any) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid payload');
    }

    const errors: Record<string, string> = {};

    if (!body.name || typeof body.name !== 'string') {
        errors.name = 'Plan name is required';
    }

    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
        errors.price = 'Price must be a positive number';
    }

    if (body.interval && !VALID_INTERVALS.includes(body.interval)) {
        errors.interval = 'Invalid billing interval';
    }

    if (body.type && !VALID_TYPES.includes(body.type)) {
        errors.type = 'Invalid plan type';
    }

    if (body.perks && !Array.isArray(body.perks)) {
        errors.perks = 'Perks must be an array of strings';
    }

    if (Object.keys(errors).length > 0) {
        const error = new Error('VALIDATION_FAILED');
        (error as any).details = errors;
        throw error;
    }

    const interval: PlanInterval = body.interval || 'monthly';
    const type: PlanType = body.type || 'subscription';

    return {
        name: body.name.trim(),
        description: typeof body.description === 'string' ? body.description.trim() : '',
        price,
        interval,
        type,
        perks: Array.isArray(body.perks) ? body.perks.filter((perk: unknown) => typeof perk === 'string').slice(0, 20) : [],
        isActive: body.isActive !== false,
        razorpayPlanId: typeof body.razorpayPlanId === 'string' ? body.razorpayPlanId.trim() : undefined
    };
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const plans = await db.collection('monetization_plans')
            .find({ creatorId: user._id.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            plans: plans.map((plan: any) => ({
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
            }))
        });
    } catch (error) {
        console.error('Monetization plans list error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load monetization plans',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const payload = await request.json();
        const planData = validatePlanPayload(payload);

        const now = new Date();
        const document = {
            creatorId: user._id.toString(),
            ...planData,
            subscriberCount: 0,
            revenue30d: 0,
            createdAt: now,
            updatedAt: now
        };

        const result = await db.collection('monetization_plans').insertOne(document);

        return NextResponse.json({
            success: true,
            planId: result.insertedId.toString(),
            plan: {
                _id: result.insertedId.toString(),
                ...document
            }
        }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'VALIDATION_FAILED') {
            return NextResponse.json(
                { error: 'Validation failed', details: (error as any).details },
                { status: 400 }
            );
        }

        console.error('Create monetization plan error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create monetization plan',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

