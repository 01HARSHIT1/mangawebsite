'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaUsers, FaShieldAlt, FaUserShield, FaGavel, FaMoneyBillWave, 
    FaChartBar, FaCheckCircle, FaTimes, FaEdit, FaSave, FaBan,
    FaInfoCircle
} from 'react-icons/fa';
import { AdminRole, getRoleDisplayName, getRoleDescription, ROLE_PERMISSIONS } from '@/lib/admin-rbac';

interface AdminUser {
    _id: string;
    email: string;
    username: string;
    adminRole: AdminRole;
    roleDisplayName: string;
    roleDescription: string;
    createdAt: string;
    lastLogin?: string;
}

export default function AdminRolesPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchAdmins();
    }, [isAuthenticated, user, router]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/roles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins || []);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async (userId: string, newRole: AdminRole) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, adminRole: newRole })
            });

            if (response.ok) {
                await fetchAdmins();
                setEditingId(null);
                setSelectedRole(null);
                alert('Role assigned successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error assigning role:', error);
            alert('Failed to assign role');
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleIcon = (role: AdminRole) => {
        switch (role) {
            case 'super_admin': return <FaShieldAlt className="text-yellow-400" />;
            case 'content_moderator': return <FaUserShield className="text-blue-400" />;
            case 'legal_admin': return <FaGavel className="text-purple-400" />;
            case 'finance_admin': return <FaMoneyBillWave className="text-green-400" />;
            case 'analyst': return <FaChartBar className="text-orange-400" />;
            default: return <FaUsers className="text-gray-400" />;
        }
    };

    const roleOptions: AdminRole[] = ['super_admin', 'content_moderator', 'legal_admin', 'finance_admin', 'analyst'];

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Admin Roles & Permissions</h1>
                    <p className="text-gray-400">Manage admin roles and access control</p>
                </div>

                {/* Roles Overview */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {roleOptions.map((role) => {
                        const count = admins.filter(a => a.adminRole === role).length;
                        return (
                            <div key={role} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    {getRoleIcon(role)}
                                    <div>
                                        <p className="font-semibold">{getRoleDisplayName(role)}</p>
                                        <p className="text-xs text-gray-400">{count} admin{count !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{getRoleDescription(role)}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Admin List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Admin</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Last Login</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-semibold">{admin.username || admin.email}</p>
                                                <p className="text-xs text-gray-400">{admin.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(admin.adminRole)}
                                                <div>
                                                    <p className="text-sm font-semibold">{admin.roleDisplayName}</p>
                                                    <p className="text-xs text-gray-400">{admin.roleDescription}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => {
                                                    if (editingId === admin._id) {
                                                        setEditingId(null);
                                                    } else {
                                                        setEditingId(admin._id);
                                                        setSelectedRole(admin.adminRole);
                                                    }
                                                }}
                                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <FaInfoCircle />
                                                View Permissions
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-400">
                                            {admin.lastLogin
                                                ? new Date(admin.lastLogin).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {editingId === admin._id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={selectedRole || admin.adminRole}
                                                        onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                                                        className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                                                    >
                                                        {roleOptions.map((role) => (
                                                            <option key={role} value={role}>
                                                                {getRoleDisplayName(role)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleAssignRole(admin._id, selectedRole || admin.adminRole)}
                                                        disabled={submitting}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
                                                    >
                                                        <FaSave />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setSelectedRole(null);
                                                        }}
                                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingId(admin._id);
                                                        setSelectedRole(admin.adminRole);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1"
                                                >
                                                    <FaEdit />
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Permissions Modal */}
                {editingId && selectedRole && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Permissions: {getRoleDisplayName(selectedRole)}</h3>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(ROLE_PERMISSIONS[selectedRole] || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                                        <span className="text-sm text-gray-300">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                        {value ? (
                                            <FaCheckCircle className="text-green-400" />
                                        ) : (
                                            <FaBan className="text-red-400" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
