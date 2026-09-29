import { MongoClient, type MongoClientOptions } from 'mongodb';

/**
 * MongoDB client for Vercel / serverless.
 * IMPORTANT: Never throw at module import time — that crashes every API route with 500.
 * Connection errors are deferred to await clientPromise so routes can catch & fallback.
 */

const uri = process.env.MONGODB_URI;

const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 0,
    // Fail fast on Vercel instead of hanging until function timeout (network error)
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 15000,
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
    if (!uri) {
        console.error('❌ MONGODB_URI is not set. Add it in Vercel → Project → Settings → Environment Variables.');
        return Promise.reject(
            new Error('MONGODB_URI environment variable is required. Set it in Vercel Environment Variables.')
        );
    }

    // Do not log the full URI (contains credentials)
    try {
        const host = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://')).host;
        console.log('MongoDB: connecting to', host);
    } catch {
        console.log('MongoDB: connecting…');
    }

    const client = new MongoClient(uri, options);
    return client.connect().catch((error) => {
        console.error('MongoDB connection error:', error?.message || error);
        console.error(
            'Tip: In MongoDB Atlas → Network Access, allow 0.0.0.0/0 (or Vercel IPs). Check MONGODB_URI is correct.'
        );
        throw error;
    });
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // Preserve client across HMR reloads
    if (!global._mongoClientPromise) {
        global._mongoClientPromise = createClientPromise();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // Production / Vercel: reuse global across warm invocations when possible
    if (!global._mongoClientPromise) {
        global._mongoClientPromise = createClientPromise();
    }
    clientPromise = global._mongoClientPromise;
}

// Create database indexes for performance optimization
async function createIndexes() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('manga').createIndex({ uploaderId: 1 });
        await db.collection('manga').createIndex({ createdAt: -1 });
        await db.collection('manga').createIndex({ likes: -1, views: -1 });
        await db.collection('manga').createIndex({ views: -1, likes: -1 });
        await db.collection('manga').createIndex({ genres: 1 });
        await db.collection('manga').createIndex({ status: 1 });
        await db.collection('manga').createIndex({ title: 'text', description: 'text' });

        await db.collection('chapters').createIndex({ mangaId: 1 });
        await db.collection('chapters').createIndex({ mangaId: 1, chapterNumber: -1 });
        await db.collection('chapters').createIndex({ publishDate: 1 });
        await db.collection('chapters').createIndex({ createdAt: -1 });

        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ createdAt: -1 });

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Only auto-create indexes in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    createIndexes().catch((err) => console.error('Index creation failed:', err));
}

export { createIndexes };
export default clientPromise;
