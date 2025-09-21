'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaUsers, FaSearch, FaFilter, FaBan, FaCheck, FaCrown, FaTrash } from 'react-icons/fa';

interface User {
    _id: string;
    username: string;
    email: string;
    role: 'reader' | 'creator' | 'admin';
    status: 'active' | 'banned' | 'pending';
    createdAt: string;
    lastLogin?: string;
    mangaCount?: number;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        fetchUsers();
    }, [isAuthenticated, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            } else {
                // Use mock data if API fails
                setUsers(mockUsers);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Use mock data
            setUsers(mockUsers);
        } finally {
            setLoading(false);
        }
    };

    const mockUsers: User[] = [
        {
            _id: '1',
            username: 'john_reader',
            email: 'john@example.com',
            role: 'reader',
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-01-20T14:25:00Z'
        },
        {
            _id: '2',
            username: 'manga_creator_01',
            email: 'creator@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-01-10T08:15:00Z',
            lastLogin: '2024-01-20T16:45:00Z',
            mangaCount: 5
        },
        {
            _id: '3',
            username: 'admin_user',
            email: 'admin@mangasite.com',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-01-20T18:30:00Z'
        },
        {
            _id: '4',
            username: 'banned_user',
            email: 'banned@example.com',
            role: 'reader',
            status: 'banned',
            createdAt: '2024-01-12T12:00:00Z',
            lastLogin: '2024-01-18T10:00:00Z'
        }
    ];

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'promote' | 'delete') => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                // Refresh users list
                fetchUsers();
            } else {
                alert('Action failed. Please try again.');
            }
        } catch (error) {
            console.error('Failed to perform user action:', error);
            alert('Action failed. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-gray-300">Manage user accounts and permissions</p>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/60"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
                        >
                            <option value="all">All Roles</option>
                            <option value="reader">Readers</option>
                            <option value="creator">Creators</option>
                            <option value="admin">Admins</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-2xl font-bold text-white">{users.length}</p>
                            </div>
                            <FaUsers className="text-blue-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Active</p>
                                <p className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
                            </div>
                            <FaCheck className="text-green-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Creators</p>
                                <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'creator').length}</p>
                            </div>
                            <FaCrown className="text-purple-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Banned</p>
                                <p className="text-2xl font-bold text-red-400">{users.filter(u => u.status === 'banned').length}</p>
                            </div>
                            <FaBan className="text-red-400 text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-800/50 rounded-3xl backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50 border-b border-purple-500/20">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Role</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Joined</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Last Login</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-white">{user.username}</div>
                                                <div className="text-sm text-gray-400">{user.email}</div>
                                                {user.mangaCount && (
                                                    <div className="text-xs text-purple-400">{user.mangaCount} manga</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                    user.role === 'creator' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                    user.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleUserAction(user._id, 'ban')}
                                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                        title="Ban User"
                                                    >
                                                        <FaBan />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUserAction(user._id, 'unban')}
                                                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                        title="Unban User"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}

                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleUserAction(user._id, 'promote')}
                                                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                                                        title="Promote User"
                                                    >
                                                        <FaCrown />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this user?')) {
                                                            handleUserAction(user._id, 'delete');
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <FaUsers className="mx-auto text-6xl text-gray-600 mb-4" />
                        <p className="text-xl text-gray-400">No users found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
