import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Lightweight health check — does not import Mongo at module load.
 * Used to diagnose Vercel "network error" / 500 issues.
 */
export async function GET() {
    const timestamp = new Date().toISOString();
    const hasMongoUri = Boolean(process.env.MONGODB_URI);
    const hasJwt = Boolean(process.env.JWT_SECRET);

    let database: 'connected' | 'disconnected' | 'missing_uri' = 'missing_uri';
    let dbError: string | undefined;

    if (!hasMongoUri) {
        database = 'missing_uri';
        dbError = 'MONGODB_URI is not set in Vercel Environment Variables';
    } else {
        try {
            // Dynamic import so a bad mongodb module never crashes this route at import time
            const { default: clientPromise } = await import('@/lib/mongodb');
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.admin().ping();
            database = 'connected';
        } catch (error: any) {
            database = 'disconnected';
            dbError = error?.message || 'Database connection failed';
        }
    }

    const healthy = database === 'connected';
    return NextResponse.json(
        {
            status: healthy ? 'healthy' : 'degraded',
            timestamp,
            services: {
                database,
                server: 'running',
                env: {
                    MONGODB_URI: hasMongoUri ? 'set' : 'MISSING',
                    JWT_SECRET: hasJwt ? 'set' : 'MISSING',
                },
            },
            version: '2.0.0',
            ...(dbError ? { error: dbError, tip: 'MongoDB Atlas → Network Access → allow 0.0.0.0/0. Vercel → Settings → Environment Variables → add MONGODB_URI for Production.' } : {}),
        },
        { status: 200 }
    );
}
