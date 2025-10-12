import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    const { resetToken, newPassword } = await req.json();
    if (!resetToken || !newPassword) return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });
    if (newPassword.length < 6 || newPassword.length > 16) return NextResponse.json({ error: 'Password must be 6-16 characters' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ resetToken });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    const hash = await bcrypt.hash(newPassword, 10);
    await users.updateOne({ _id: user._id }, { $set: { password: hash }, $unset: { resetToken: '' } });
    return NextResponse.json({ success: true, message: 'Password reset successful!' });
} 