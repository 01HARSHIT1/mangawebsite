import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { AdminRole, getRoleDisplayName, getRoleDescription } from '@/lib/admin-rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/roles - List all admin roles
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canManageRoles');
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get all admin users
        const adminUsers = await db.collection('users')
            .find({ role: 'admin' })
            .toArray();
        
        // Map to include role info
        const adminsWithRoles = adminUsers.map(user => ({
            _id: user._id.toString(),
            email: user.email,
            username: user.username,
            adminRole: user.adminRole || (user.isSuperAdmin ? 'super_admin' : 'content_moderator'),
            roleDisplayName: getRoleDisplayName(user.adminRole || (user.isSuperAdmin ? 'super_admin' : 'content_moderator')),
            roleDescription: getRoleDescription(user.adminRole || (user.isSuperAdmin ? 'super_admin' : 'content_moderator')),
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
        }));
        
        return NextResponse.json({ admins: adminsWithRoles });
    } catch (error: any) {
        console.error('Error fetching admin roles:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch admin roles' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * POST /api/admin/roles - Assign role to admin user
 */
export async function POST(request: NextRequest) {
    try {
        const requestingAdmin = await requireAdminPermission(request, 'canManageRoles');
        
        const { userId, adminRole } = await request.json();
        
        if (!userId || !adminRole) {
            return NextResponse.json(
                { error: 'userId and adminRole are required' },
                { status: 400 }
            );
        }
        
        // Validate role
        const validRoles: AdminRole[] = ['super_admin', 'content_moderator', 'legal_admin', 'finance_admin', 'analyst'];
        if (!validRoles.includes(adminRole)) {
            return NextResponse.json(
                { error: 'Invalid admin role' },
                { status: 400 }
            );
        }
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Check if target user exists and is admin
        const targetUser = await db.collection('users').findOne({
            _id: new ObjectId(userId),
            role: 'admin'
        });
        
        if (!targetUser) {
            return NextResponse.json(
                { error: 'Admin user not found' },
                { status: 404 }
            );
        }
        
        // Update admin role
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    adminRole: adminRole,
                    isSuperAdmin: adminRole === 'super_admin', // Legacy flag
                    updatedAt: new Date(),
                }
            }
        );
        
        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to update admin role' },
                { status: 500 }
            );
        }
        
        // Log role assignment
        await db.collection('admin_audit_logs').insertOne({
            adminId: requestingAdmin._id,
            adminEmail: requestingAdmin.email,
            action: 'assign_admin_role',
            targetUserId: userId,
            targetUserEmail: targetUser.email,
            details: {
                previousRole: targetUser.adminRole || (targetUser.isSuperAdmin ? 'super_admin' : null),
                newRole: adminRole,
            },
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });
        
        return NextResponse.json({
            success: true,
            message: `Admin role assigned: ${getRoleDisplayName(adminRole)}`,
        });
    } catch (error: any) {
        console.error('Error assigning admin role:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign admin role' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * GET /api/admin/roles/permissions - Get permissions for a role
 */
export async function GET_PERMISSIONS(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canViewAuditLogs');
        
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') as AdminRole | null;
        
        if (!role) {
            return NextResponse.json(
                { error: 'role query parameter is required' },
                { status: 400 }
            );
        }
        
        const { ROLE_PERMISSIONS, getRoleDisplayName, getRoleDescription } = await import('@/lib/admin-rbac');
        
        const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.analyst;
        
        return NextResponse.json({
            role,
            displayName: getRoleDisplayName(role),
            description: getRoleDescription(role),
            permissions,
        });
    } catch (error: any) {
        console.error('Error fetching role permissions:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch role permissions' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}
