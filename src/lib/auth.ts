import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';

export interface User {
    _id: string;
    email: string;
    username: string;
    role: 'user' | 'creator' | 'admin';
    isCreator: boolean;
    creatorProfile?: {
        displayName: string;
        bio?: string;
        avatar?: string;
        socialLinks?: {
            twitter?: string;
            instagram?: string;
            website?: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    isCreator: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
}

export async function createUser(email: string, username: string, password: string): Promise<User> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const existingUsername = await db.collection('users').findOne({ username });
    if (existingUsername) {
        throw new Error('Username already taken');
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    const user = {
        email,
        username,
        password: hashedPassword,
        role: 'user' as const,
        isCreator: false,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection('users').insertOne(user);

    return {
        _id: result.insertedId.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        isCreator: user.isCreator,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');

    const user = await db.collection('users').findOne({ email });
    if (!user) {
        return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
        return null;
    }

    return {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        isCreator: user.isCreator,
        creatorProfile: user.creatorProfile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

export async function upgradeToCreator(userId: string, creatorProfile: {
    displayName: string;
    bio?: string;
    avatar?: string;
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        website?: string;
    };
}): Promise<User> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');

    const now = new Date();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                role: 'creator',
                isCreator: true,
                creatorProfile,
                updatedAt: now
            }
        }
    );

    if (result.modifiedCount === 0) {
        throw new Error('Failed to upgrade user to creator');
    }

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!updatedUser) {
        throw new Error('User not found after upgrade');
    }

    return {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isCreator: updatedUser.isCreator,
        creatorProfile: updatedUser.creatorProfile,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
    };
}

export async function getUserById(userId: string): Promise<User | null> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
        return null;
    }

    return {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        isCreator: user.isCreator,
        creatorProfile: user.creatorProfile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

export async function requireAuth(request: Request): Promise<User> {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
        throw new Error('Authentication required');
    }

    const payload = verifyToken(token);
    if (!payload) {
        throw new Error('Invalid token');
    }

    const user = await getUserById(payload.userId);
    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

export async function requireCreator(request: Request): Promise<User> {
    const user = await requireAuth(request);
    if (!user.isCreator) {
        throw new Error('Creator privileges required');
    }
    return user;
}

export async function requireAdmin(request: Request): Promise<User> {
    const user = await requireAuth(request);
    if (user.role !== 'admin') {
        throw new Error('Admin privileges required');
    }
    return user;
}