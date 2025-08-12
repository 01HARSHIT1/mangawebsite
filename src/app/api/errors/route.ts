import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Helper functions (assume these are implemented elsewhere or below)
// categorizeError, determineSeverity, sendCriticalErrorAlert, updateErrorStats, getErrorStats

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            errorId,
            message,
            stack,
            componentStack,
            url,
            userAgent,
            timestamp,
            userId,
            sessionId,
        } = body;

        const { db } = await connectToDatabase();

        // Categorize error
        const errorCategory = categorizeError(message, stack);
        const severity = determineSeverity(message, stack);

        // Create error log
        const errorLog = {
            errorId,
            message,
            stack,
            componentStack,
            url,
            userAgent,
            timestamp,
            userId,
            sessionId,
            category: errorCategory,
            severity,
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            createdAt: new Date(),
        };

        // Store error in database
        await db.collection('error_logs').insertOne(errorLog);

        // Check if this is a critical error that needs immediate attention
        if (severity === 'critical') {
            await sendCriticalErrorAlert(errorLog);
        }

        // Update error statistics
        await updateErrorStats(errorCategory, severity);

        return NextResponse.json({
            success: true,
            errorId,
            message: 'Error logged successfully',
        });
    } catch (error) {
        console.error('Error logging error:', error);
        return NextResponse.json({
            error: 'Failed to log error',
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const severity = searchParams.get('severity');
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const { db } = await connectToDatabase();

        // Build filter
        const filter: any = {};
        if (severity) filter.severity = severity;
        if (category) filter.category = category;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Get errors with pagination
        const skip = (page - 1) * limit;
        const errors = await db.collection('error_logs')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get total count
        const total = await db.collection('error_logs').countDocuments(filter);

        // Get error statistics
        const stats = await getErrorStats();

        return NextResponse.json({
            errors,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats,
        });
    } catch (error) {
        console.error('Error fetching errors:', error);
        return NextResponse.json({
            error: 'Failed to fetch errors',
        }, { status: 500 });
    }
}

function categorizeError(message: string, stack?: string): string {
    const errorText = `${message} ${stack || ''}`.toLowerCase();
    if (errorText.includes('network') || errorText.includes('fetch')) return 'network';
    if (errorText.includes('authentication') || errorText.includes('unauthorized')) return 'auth';
    if (errorText.includes('database') || errorText.includes('mongodb')) return 'database';
    if (errorText.includes('validation') || errorText.includes('invalid')) return 'validation';
    if (errorText.includes('permission') || errorText.includes('forbidden')) return 'permission';
    if (errorText.includes('not found') || errorText.includes('404')) return 'not_found';
    if (errorText.includes('timeout') || errorText.includes('deadline')) return 'timeout';
    if (errorText.includes('memory') || errorText.includes('heap')) return 'memory';
    return 'unknown';
}

function determineSeverity(message: string, stack?: string): 'low' | 'medium' | 'high' | 'critical' {
    const errorText = `${message} ${stack || ''}`.toLowerCase();
    if (
        errorText.includes('database connection') ||
        errorText.includes('memory leak') ||
        errorText.includes('security') ||
        errorText.includes('authentication bypass')
    ) return 'critical';
    if (
        errorText.includes('payment') ||
        errorText.includes('file upload') ||
        errorText.includes('user data')
    ) return 'high';
    if (
        errorText.includes('api') ||
        errorText.includes('network') ||
        errorText.includes('timeout')
    ) return 'medium';
    return 'low';
}

// Dummy implementations for demonstration
async function sendCriticalErrorAlert(errorLog: any) {
    try {
        // In a real application, send to alerting service (Slack, PagerDuty, etc.)
        console.error('CRITICAL ERROR ALERT:', errorLog);
        if (process.env.ERROR_WEBHOOK_URL) {
            await fetch(process.env.ERROR_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 Critical Error Detected\n\nError: ${errorLog.message}\nCategory: ${errorLog.category}\nURL: ${errorLog.url}\nTime: ${errorLog.timestamp}`,
                }),
            });
        }
    } catch (error) {
        console.error('Failed to send critical error alert:', error);
    }
}

async function updateErrorStats(category: string, severity: string) {
    try {
        const { db } = await connectToDatabase();
        const today = new Date().toISOString().split('T')[0];
        // Update daily stats
        await db.collection('error_stats').updateOne(
            { date: today },
            {
                $inc: {
                    [`categories.${category}`]: 1,
                    [`severities.${severity}`]: 1,
                    total: 1,
                },
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Failed to update error stats:', error);
    }
}

async function getErrorStats() {
    // Dummy implementation
    return {};
} 