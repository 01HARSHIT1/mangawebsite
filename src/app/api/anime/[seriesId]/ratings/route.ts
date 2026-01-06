import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST: Submit or update a user rating for an anime series
export async function POST(
    request: NextRequest,
    { params }: { params: { seriesId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        const username = payload.username || payload.email?.split('@')[0] || 'User';

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { seriesId } = params;
        const body = await request.json();
        const { rating, review } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Check if series exists
        const series = await db.collection('anime_series').findOne({
            _id: new ObjectId(seriesId),
        });

        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        // Check if user already rated this series
        const existingRating = await db.collection('anime_ratings').findOne({
            seriesId: new ObjectId(seriesId),
            userId: new ObjectId(userId),
        });

        if (existingRating) {
            // Update existing rating
            await db.collection('anime_ratings').updateOne(
                {
                    seriesId: new ObjectId(seriesId),
                    userId: new ObjectId(userId),
                },
                {
                    $set: {
                        rating,
                        review: review || existingRating.review,
                        updatedAt: new Date(),
                    },
                }
            );
        } else {
            // Create new rating
            await db.collection('anime_ratings').insertOne({
                _id: new ObjectId(),
                seriesId: new ObjectId(seriesId),
                userId: new ObjectId(userId),
                username,
                rating,
                review: review || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Recalculate average rating for the series
        const allRatings = await db
            .collection('anime_ratings')
            .find({ seriesId: new ObjectId(seriesId) })
            .toArray();

        const averageRating =
            allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        // Update series rating
        await db.collection('anime_series').updateOne(
            { _id: new ObjectId(seriesId) },
            {
                $set: {
                    rating: averageRating,
                    ratingCount: allRatings.length,
                },
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Rating submitted successfully',
            rating: averageRating,
            ratingCount: allRatings.length,
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        return NextResponse.json(
            { error: 'Failed to submit rating' },
            { status: 500 }
        );
    }
}

// GET: Get user's rating for a series
export async function GET(
    request: NextRequest,
    { params }: { params: { seriesId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ rating: null });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ rating: null });
        }

        const { seriesId } = params;
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const userRating = await db.collection('anime_ratings').findOne({
            seriesId: new ObjectId(seriesId),
            userId: new ObjectId(userId),
        });

        return NextResponse.json({
            rating: userRating?.rating || null,
            review: userRating?.review || null,
        });
    } catch (error) {
        console.error('Error fetching user rating:', error);
        return NextResponse.json({ rating: null });
    }
}

