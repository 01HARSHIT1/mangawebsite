import { MongoClient } from 'mongodb';

// Use a default URI if environment variable is not set
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@127.0.0.1:27017/mangawebsite?authSource=admin';

console.log('MongoDB URI:', uri);
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect().catch(error => {
            console.error('MongoDB connection error:', error);
            throw error;
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Create database indexes for performance optimization
async function createIndexes() {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Manga collection indexes
        await db.collection('manga').createIndex({ uploaderId: 1 });
        await db.collection('manga').createIndex({ createdAt: -1 });
        await db.collection('manga').createIndex({ likes: -1, views: -1 });
        await db.collection('manga').createIndex({ genre: 1 });
        await db.collection('manga').createIndex({ status: 1 });
        await db.collection('manga').createIndex({ title: 'text', description: 'text' });

        // Chapters collection indexes
        await db.collection('chapters').createIndex({ mangaId: 1 });
        await db.collection('chapters').createIndex({ mangaId: 1, chapterNumber: -1 });
        await db.collection('chapters').createIndex({ publishDate: 1 });
        await db.collection('chapters').createIndex({ createdAt: -1 });
        await db.collection('chapters').createIndex({ title: 'text' });

        // Users collection indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ isBanned: 1 });
        await db.collection('users').createIndex({ createdAt: -1 });
        await db.collection('users').createIndex({ 'readingHistory.timestamp': -1 });
        await db.collection('users').createIndex({ 'readingHistory.mangaId': 1 });
        await db.collection('users').createIndex({ 'readingHistory.chapterId': 1 });

        // Payments collection indexes
        await db.collection('payments').createIndex({ userId: 1 });
        await db.collection('payments').createIndex({ timestamp: -1 });
        await db.collection('payments').createIndex({ type: 1 });
        await db.collection('payments').createIndex({ mangaId: 1 });
        await db.collection('payments').createIndex({ episodeId: 1 });

        // Ads collection indexes
        await db.collection('ads').createIndex({ active: 1 });
        await db.collection('ads').createIndex({ location: 1 });
        await db.collection('ads').createIndex({ startDate: 1, endDate: 1 });
        await db.collection('ads').createIndex({ priority: -1 });

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Create indexes on first connection - only on server side
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    createIndexes();
}

export default clientPromise; 