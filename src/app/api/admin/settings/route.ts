import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const { db } = await connectToDatabase();
        // Get all system settings
        let settings = await db.collection('system_settings').find().toArray();
        // If no settings exist, create default ones
        if (settings.length === 0) {
            const defaultSettings = [
                {
                    key: 'site_maintenance',
                    value: false,
                    description: 'Enable site maintenance mode',
                    category: 'general',
                },
                {
                    key: 'registration_enabled',
                    value: true,
                    description: 'Allow new user registrations',
                    category: 'users',
                },
                {
                    key: 'upload_enabled',
                    value: true,
                    description: 'Allow content uploads',
                    category: 'content',
                },
                {
                    key: 'max_file_size',
                    value: 50,
                    description: 'Maximum file size in MB',
                    category: 'content',
                },
                {
                    key: 'auto_moderation',
                    value: true,
                    description: 'Enable automatic content moderation',
                    category: 'moderation',
                },
                {
                    key: 'comment_approval',
                    value: false,
                    description: 'Require comment approval',
                    category: 'moderation',
                },
                {
                    key: 'email_notifications',
                    value: true,
                    description: 'Enable email notifications',
                    category: 'notifications',
                },
                {
                    key: 'max_upload_per_day',
                    value: 10,
                    description: 'Maximum uploads per user per day',
                    category: 'content',
                },
            ];
            await db.collection('system_settings').insertMany(defaultSettings);
            return NextResponse.json({ settings: defaultSettings });
        }
        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const body = await request.json();
        const { key, value } = body;
        if (!key) {
            return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
        }
        const { db } = await connectToDatabase();
        // Update the setting
        const result = await db.collection('system_settings').updateOne(
            { key },
            { $set: { value, updatedAt: new Date(), updatedBy: user._id } }
        );
        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
        }
        // Log the setting change
        const settingLog = {
            settingKey: key,
            oldValue: null, // Could fetch old value if needed
            newValue: value,
            updatedBy: user._id,
            updatedByEmail: user.email,
            timestamp: new Date(),
        };
        await db.collection('setting_logs').insertOne(settingLog);
        return NextResponse.json({
            success: true,
            message: 'Setting updated successfully',
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 