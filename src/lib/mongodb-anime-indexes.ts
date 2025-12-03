/**
 * Database indexes for Anime collections
 * Run this to create indexes for optimal performance
 */
import clientPromise from './mongodb';

export async function createAnimeIndexes() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Anime Series indexes
        await db.collection('anime_series').createIndex({ title: 'text', description: 'text' });
        await db.collection('anime_series').createIndex({ genres: 1 });
        await db.collection('anime_series').createIndex({ status: 1 });
        await db.collection('anime_series').createIndex({ year: -1 });
        await db.collection('anime_series').createIndex({ rating: -1 });
        await db.collection('anime_series').createIndex({ createdAt: -1 });
        await db.collection('anime_series').createIndex({ studio: 1 });

        // Episodes indexes
        await db.collection('anime_episodes').createIndex({ seriesId: 1 });
        await db.collection('anime_episodes').createIndex({ seriesId: 1, episodeNumber: 1 });
        await db.collection('anime_episodes').createIndex({ seasonId: 1 });
        await db.collection('anime_episodes').createIndex({ releaseDate: -1 });

        // Watch History indexes
        await db.collection('anime_watch_history').createIndex({ userId: 1 });
        await db.collection('anime_watch_history').createIndex({ userId: 1, lastWatchedAt: -1 });
        await db.collection('anime_watch_history').createIndex({ seriesId: 1 });
        await db.collection('anime_watch_history').createIndex({ episodeId: 1 });
        await db.collection('anime_watch_history').createIndex({ userId: 1, episodeId: 1 }, { unique: true });

        // My List indexes
        await db.collection('anime_my_list').createIndex({ userId: 1 });
        await db.collection('anime_my_list').createIndex({ userId: 1, listType: 1 });
        await db.collection('anime_my_list').createIndex({ userId: 1, seriesId: 1, listType: 1 }, { unique: true });
        await db.collection('anime_my_list').createIndex({ addedAt: -1 });

        // Recommendations Cache indexes
        await db.collection('anime_recommendations_cache').createIndex({ userId: 1 }, { unique: true });
        await db.collection('anime_recommendations_cache').createIndex({ expiresAt: 1 });

        // Playback Events indexes (for analytics)
        await db.collection('anime_playback_events').createIndex({ userId: 1 });
        await db.collection('anime_playback_events').createIndex({ episodeId: 1 });
        await db.collection('anime_playback_events').createIndex({ seriesId: 1 });
        await db.collection('anime_playback_events').createIndex({ eventType: 1 });
        await db.collection('anime_playback_events').createIndex({ timestamp: -1 });
        await db.collection('anime_playback_events').createIndex({ region: 1 });

        // Transcode Jobs indexes
        await db.collection('anime_transcode_jobs').createIndex({ episodeId: 1 });
        await db.collection('anime_transcode_jobs').createIndex({ status: 1 });
        await db.collection('anime_transcode_jobs').createIndex({ createdAt: -1 });

        // User subscription indexes (extend existing users collection)
        await db.collection('users').createIndex({ 'subscription.planName': 1 });
        await db.collection('users').createIndex({ 'subscription.status': 1 });
        await db.collection('users').createIndex({ 'subscription.endsAt': 1 });

        console.log('✅ Anime database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating anime indexes:', error);
        throw error;
    }
}

// Auto-create indexes in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    createAnimeIndexes().catch(err => console.error('Index creation failed:', err));
}

