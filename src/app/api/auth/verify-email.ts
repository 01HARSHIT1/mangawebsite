import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ verificationToken: token });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    await users.updateOne({ _id: user._id }, { $set: { isVerified: true }, $unset: { verificationToken: '' } });
    return NextResponse.json({ success: true, message: 'Email verified!' });
} 