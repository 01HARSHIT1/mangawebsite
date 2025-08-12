import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export interface AuthUser {
  _id: string;
  email?: string;
  role?: 'admin' | 'creator' | 'viewer';
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId: string | undefined = payload.userId || payload._id || payload.id;
    if (!userId) return null;
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return null;
    return {
      _id: user._id?.toString?.() || String(user._id),
      email: user.email,
      role: user.role || 'viewer',
    };
  } catch {
    return null;
  }
}