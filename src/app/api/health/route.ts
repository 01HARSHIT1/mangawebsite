import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        // Check database connection
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Simple ping to verify database is accessible
        await db.admin().ping();
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                server: 'running'
            },
            version: '2.0.0'
        };

        return NextResponse.json(healthStatus, { status: 200 });
    } catch (error) {
        // If database fails, still return healthy status for the app
        // but indicate database issue
        const healthStatus = {
            status: 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                database: 'disconnected',
                server: 'running'
            },
            version: '2.0.0',
            error: 'Database connection failed'
        };

        return NextResponse.json(healthStatus, { status: 200 });
    }
}
