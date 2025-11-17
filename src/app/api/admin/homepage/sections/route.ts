import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all sections
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

        const sections = await db.collection('homepage_sections')
            .find({})
            .sort({ order: 1 })
            .toArray();

        return NextResponse.json({
            sections: sections.map(s => ({
                ...s,
                _id: s._id.toString()
            }))
        });
    } catch (error) {
        console.error('Failed to fetch sections:', error);
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }
}

// PUT: Update sections (for reordering and toggling)
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
        const { sections } = body;

        if (!Array.isArray(sections)) {
            return NextResponse.json({ error: 'Sections array required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Update all sections
        await Promise.all(sections.map((section: any) => 
            db.collection('homepage_sections').updateOne(
                { _id: new ObjectId(section._id) },
                { 
                    $set: { 
                        order: section.order,
                        isActive: section.isActive,
                        updatedAt: new Date()
                    } 
                }
            )
        ));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update sections:', error);
        return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 });
    }
}

