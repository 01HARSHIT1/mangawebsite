import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/audit-logs - Get admin audit logs
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canViewAuditLogs');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action') || '';
        const adminId = searchParams.get('adminId') || '';
        const targetId = searchParams.get('targetId') || '';
        const dateFrom = searchParams.get('dateFrom') || '';
        const dateTo = searchParams.get('dateTo') || '';
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Build filter
        const filter: any = {};
        if (action) filter.action = { $regex: action, $options: 'i' };
        if (adminId) filter.adminId = new ObjectId(adminId);
        if (targetId) filter.targetId = targetId;
        if (dateFrom || dateTo) {
            filter.timestamp = {};
            if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
            if (dateTo) filter.timestamp.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        
        // Get logs with pagination
        const skip = (page - 1) * limit;
        const logs = await db.collection('admin_audit_logs')
            .find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        // Get total count
        const total = await db.collection('admin_audit_logs').countDocuments(filter);
        
        // Get admin names
        const adminIds = [...new Set(logs.map((log: any) => log.adminId?.toString()).filter(Boolean))];
        const admins = await db.collection('users')
            .find({ _id: { $in: adminIds.map(id => new ObjectId(id)) } })
            .toArray();
        
        const adminMap = new Map(admins.map((a: any) => [a._id.toString(), a.username || a.email]));
        
        // Format logs
        const formattedLogs = logs.map((log: any) => ({
            _id: log._id.toString(),
            adminId: log.adminId?.toString() || '',
            adminEmail: log.adminEmail || '',
            adminUsername: adminMap.get(log.adminId?.toString() || '') || 'Unknown',
            action: log.action || '',
            targetId: log.targetId || '',
            targetUserId: log.targetUserId || '',
            targetUserEmail: log.targetUserEmail || '',
            details: log.details || {},
            timestamp: log.timestamp || new Date(),
            ipAddress: log.ipAddress || '',
            userAgent: log.userAgent || '',
        }));
        
        // Get statistics
        const stats = {
            total: await db.collection('admin_audit_logs').countDocuments({}),
            last24h: await db.collection('admin_audit_logs').countDocuments({
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            last7d: await db.collection('admin_audit_logs').countDocuments({
                timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),
        };
        
        // Action counts
        const actionCounts = await db.collection('admin_audit_logs')
            .aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
            .toArray();
        
        return NextResponse.json({
            logs: formattedLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats,
            actionCounts: actionCounts.map((a: any) => ({
                action: a._id,
                count: a.count,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch audit logs' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * POST /api/admin/audit-logs/export - Export audit logs as CSV
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canExportData');
        
        const { dateFrom, dateTo, action } = await request.json();
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Build filter
        const filter: any = {};
        if (action) filter.action = { $regex: action, $options: 'i' };
        if (dateFrom || dateTo) {
            filter.timestamp = {};
            if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
            if (dateTo) filter.timestamp.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        
        // Get all logs for export
        const logs = await db.collection('admin_audit_logs')
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(10000) // Limit to 10k records
            .toArray();
        
        // Get admin names
        const adminIds = [...new Set(logs.map((log: any) => log.adminId?.toString()).filter(Boolean))];
        const admins = await db.collection('users')
            .find({ _id: { $in: adminIds.map(id => new ObjectId(id)) } })
            .toArray();
        
        const adminMap = new Map(admins.map((a: any) => [a._id.toString(), a.username || a.email]));
        
        // Convert to CSV
        const headers = ['Timestamp', 'Admin', 'Email', 'Action', 'Target ID', 'Target User', 'IP Address', 'Details'];
        const rows = logs.map((log: any) => [
            new Date(log.timestamp || new Date()).toISOString(),
            adminMap.get(log.adminId?.toString() || '') || 'Unknown',
            log.adminEmail || '',
            log.action || '',
            log.targetId || '',
            log.targetUserEmail || '',
            log.ipAddress || '',
            JSON.stringify(log.details || {}),
        ]);
        
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Log export action
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id,
            adminEmail: admin.email,
            action: 'export_audit_logs',
            details: {
                dateFrom,
                dateTo,
                action,
                recordCount: logs.length,
            },
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });
        
        return NextResponse.json({
            csv,
            recordCount: logs.length,
        });
    } catch (error: any) {
        console.error('Error exporting audit logs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export audit logs' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}
