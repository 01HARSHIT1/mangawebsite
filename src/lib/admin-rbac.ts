/**
 * Admin RBAC (Role-Based Access Control)
 * Defines admin roles and their permissions
 */

export type AdminRole = 'super_admin' | 'content_moderator' | 'legal_admin' | 'finance_admin' | 'analyst';

export interface AdminPermissions {
    // Content Management
    canModerateContent: boolean;
    canApproveContent: boolean;
    canDeleteContent: boolean;
    canFeatureContent: boolean;
    
    // User Management
    canManageUsers: boolean;
    canBanUsers: boolean;
    canVerifyCreators: boolean;
    canManageRoles: boolean;
    
    // Reports & Moderation
    canViewReports: boolean;
    canResolveReports: boolean;
    canIssueStrikes: boolean;
    
    // Copyright & Legal
    canViewCopyrightClaims: boolean;
    canProcessCopyrightClaims: boolean;
    canBlockRegions: boolean;
    canIssueDMCA: boolean;
    
    // Finance & Monetization
    canViewRevenue: boolean;
    canProcessPayouts: boolean;
    canManageMonetization: boolean;
    canViewCreatorEarnings: boolean;
    
    // Analytics
    canViewAnalytics: boolean;
    canExportData: boolean;
    
    // System
    canManageSettings: boolean;
    canManageRoles: boolean;
    canViewAuditLogs: boolean;
}

/**
 * Role Permissions Matrix
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
    super_admin: {
        // Everything
        canModerateContent: true,
        canApproveContent: true,
        canDeleteContent: true,
        canFeatureContent: true,
        canManageUsers: true,
        canBanUsers: true,
        canVerifyCreators: true,
        canManageRoles: true,
        canViewReports: true,
        canResolveReports: true,
        canIssueStrikes: true,
        canViewCopyrightClaims: true,
        canProcessCopyrightClaims: true,
        canBlockRegions: true,
        canIssueDMCA: true,
        canViewRevenue: true,
        canProcessPayouts: true,
        canManageMonetization: true,
        canViewCreatorEarnings: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageSettings: true,
        canViewAuditLogs: true,
    },
    
    content_moderator: {
        // Content & Reports
        canModerateContent: true,
        canApproveContent: true,
        canDeleteContent: true,
        canFeatureContent: false,
        canManageUsers: false,
        canBanUsers: false,
        canVerifyCreators: true,
        canManageRoles: false,
        canViewReports: true,
        canResolveReports: true,
        canIssueStrikes: true,
        canViewCopyrightClaims: false,
        canProcessCopyrightClaims: false,
        canBlockRegions: false,
        canIssueDMCA: false,
        canViewRevenue: false,
        canProcessPayouts: false,
        canManageMonetization: false,
        canViewCreatorEarnings: false,
        canViewAnalytics: true,
        canExportData: false,
        canManageSettings: false,
        canViewAuditLogs: true,
    },
    
    legal_admin: {
        // Legal & Copyright
        canModerateContent: false,
        canApproveContent: false,
        canDeleteContent: false,
        canFeatureContent: false,
        canManageUsers: false,
        canBanUsers: false,
        canVerifyCreators: false,
        canManageRoles: false,
        canViewReports: true,
        canResolveReports: false,
        canIssueStrikes: true,
        canViewCopyrightClaims: true,
        canProcessCopyrightClaims: true,
        canBlockRegions: true,
        canIssueDMCA: true,
        canViewRevenue: false,
        canProcessPayouts: false,
        canManageMonetization: false,
        canViewCreatorEarnings: false,
        canViewAnalytics: false,
        canExportData: true, // For legal evidence
        canManageSettings: false,
        canViewAuditLogs: true,
    },
    
    finance_admin: {
        // Finance & Monetization
        canModerateContent: false,
        canApproveContent: false,
        canDeleteContent: false,
        canFeatureContent: false,
        canManageUsers: false,
        canBanUsers: false,
        canVerifyCreators: false,
        canManageRoles: false,
        canViewReports: false,
        canResolveReports: false,
        canIssueStrikes: false,
        canViewCopyrightClaims: false,
        canProcessCopyrightClaims: false,
        canBlockRegions: false,
        canIssueDMCA: false,
        canViewRevenue: true,
        canProcessPayouts: true,
        canManageMonetization: true,
        canViewCreatorEarnings: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageSettings: false,
        canViewAuditLogs: true,
    },
    
    analyst: {
        // Read-only analytics
        canModerateContent: false,
        canApproveContent: false,
        canDeleteContent: false,
        canFeatureContent: false,
        canManageUsers: false,
        canBanUsers: false,
        canVerifyCreators: false,
        canManageRoles: false,
        canViewReports: true,
        canResolveReports: false,
        canIssueStrikes: false,
        canViewCopyrightClaims: true,
        canProcessCopyrightClaims: false,
        canBlockRegions: false,
        canIssueDMCA: false,
        canViewRevenue: true,
        canProcessPayouts: false,
        canManageMonetization: false,
        canViewCreatorEarnings: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageSettings: false,
        canViewAuditLogs: true,
    },
};

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: AdminRole | string): AdminPermissions {
    const normalizedRole = role as AdminRole;
    if (normalizedRole === 'super_admin' || normalizedRole === 'admin') {
        // Legacy admin role maps to super_admin
        return ROLE_PERMISSIONS.super_admin;
    }
    return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.analyst;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: { role?: string; adminRole?: AdminRole }, permission: keyof AdminPermissions): boolean {
    const adminRole = (user.adminRole || user.role) as AdminRole;
    const permissions = getRolePermissions(adminRole);
    return permissions[permission] || false;
}

/**
 * Require a specific permission (throws if not authorized)
 */
export function requirePermission(user: { role?: string; adminRole?: AdminRole }, permission: keyof AdminPermissions): void {
    if (!hasPermission(user, permission)) {
        throw new Error(`Permission denied: ${permission} required`);
    }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminRole | string): string {
    const roleMap: Record<string, string> = {
        super_admin: 'Super Admin',
        content_moderator: 'Content Moderator',
        legal_admin: 'Legal Admin',
        finance_admin: 'Finance Admin',
        analyst: 'Analyst',
        admin: 'Super Admin', // Legacy
    };
    return roleMap[role] || 'Admin';
}

/**
 * Get role description
 */
export function getRoleDescription(role: AdminRole | string): string {
    const descMap: Record<string, string> = {
        super_admin: 'Full platform access and control',
        content_moderator: 'Content review, moderation, and user management',
        legal_admin: 'Copyright claims, DMCA, legal compliance',
        finance_admin: 'Revenue, payouts, and monetization management',
        analyst: 'Read-only access to analytics and reports',
    };
    return descMap[role] || 'Platform access';
}
