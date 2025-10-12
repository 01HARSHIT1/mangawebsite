import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) return NextResponse.json({ success: true }); // Don't reveal if email exists
    const resetToken = crypto.randomBytes(32).toString('hex');
    await users.updateOne({ _id: user._id }, { $set: { resetToken } });
    // Placeholder for sending email
    // sendResetEmail(email, resetToken)
    return NextResponse.json({ success: true, message: 'If this email is registered, a reset link will be sent.' });
} 