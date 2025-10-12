"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaChartLine, FaMoneyBillWave, FaExclamationTriangle, FaEnvelope, FaShieldAlt, FaCog, FaSignOutAlt, FaBars, FaTimes, FaCrown, FaUserPlus, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'analytics' | 'moderation' | 'contact' | 'users'>('overview');
    const [analytics, setAnalytics] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [upgradingUser, setUpgradingUser] = useState<string | null>(null);
    const [upgradeMessage, setUpgradeMessage] = useState("");
    const router = useRouter();
    const { user: authUser, logout } = useAuth();

    useEffect(() => {
        if (!authUser) {
            router.push('/login');
            return;
        }

        if (authUser.role !== 'admin') {
            router.push('/');
            return;
        }

        setUser(authUser);
        setLoading(false);
    }, [authUser, router]);

    useEffect(() => {
        if (!user) return;

        // Fetch analytics data
        fetch('/api/admin/analytics', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(setAnalytics);

        // Fetch reports
        fetch('/api/admin/reports', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(setReports);

        // Fetch contact messages
        fetch('/api/admin/contacts', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(setContacts);

        // Fetch users
        fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(setUsers);
    }, [user]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleManualUpgrade = async (userId: string, newRole: 'creator' | 'admin') => {
        setUpgradingUser(userId);
        setUpgradeMessage("");

        try {
            const response = await fetch('/api/admin/users/manual-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId, newRole })
            });

            const data = await response.json();

            if (response.ok) {
                setUpgradeMessage(`Successfully upgraded user to ${newRole}!`);
                // Refresh users list
                fetch('/api/admin/users', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                    .then(res => res.json())
                    .then(setUsers);
            } else {
                setUpgradeMessage(data.error || "Upgrade failed");
            }
        } catch (err) {
            setUpgradeMessage("Network error. Please try again.");
        } finally {
            setUpgradingUser(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <span className="text-sm sm:text-base">Loading...</span>
            </div>
        </div>
    );
    if (!user) return null;

    // Skeleton for analytics cards
    const AnalyticsCardSkeleton = () => (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 animate-pulse">
            <div className="flex items-center">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-700" />
                <div className="ml-3 sm:ml-4">
                    <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gray-700 rounded mb-2" />
                    <div className="h-4 sm:h-6 w-12 sm:w-16 bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    );

    // Skeleton for table rows
    const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="h-3 sm:h-4 w-full bg-gray-700 rounded animate-pulse" />
                </td>
            ))}
        </tr>
    );

    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: FaChartLine },
        { id: 'analytics', label: 'Analytics', icon: FaChartLine },
        { id: 'moderation', label: 'Moderation', icon: FaExclamationTriangle },
        { id: 'contact', label: 'Contact', icon: FaEnvelope },
        { id: 'users', label: 'Users', icon: FaUsers }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                    <div className="flex justify-between items-center py-4 sm:py-6">
                        <div className="flex items-center">
                            <FaShieldAlt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mr-2 sm:mr-3" />
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="lg:hidden p-2 text-white hover:text-blue-400 transition focus:outline-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label="Toggle mobile menu"
                            aria-expanded={showMobileMenu}
                        >
                            {showMobileMenu ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                        </button>

                        {/* Desktop User Info */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <span className="text-gray-300 text-sm sm:text-base">Welcome, {user.nickname || user.email}</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]"
                            >
                                <FaSignOutAlt className="mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile User Info */}
            {showMobileMenu && (
                <div className="lg:hidden bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Welcome, {user.nickname || user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm min-h-[44px]"
                        >
                            <FaSignOutAlt className="mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex space-x-6 lg:space-x-8">
                        {navigationItems.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTab(id as any)}
                                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors min-h-[44px] ${tab === id
                                    ? 'border-blue-400 text-blue-400'
                                    : 'border-transparent text-gray-300 hover:text-gray-200'
                                    }`}
                            >
                                <Icon className="mr-2" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Navigation */}
                    <div className={`lg:hidden ${showMobileMenu ? 'block' : 'hidden'}`}>
                        <div className="py-2 space-y-1">
                            {navigationItems.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        setTab(id as any);
                                        setShowMobileMenu(false);
                                    }}
                                    className={`w-full flex items-center py-3 px-3 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${tab === id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-gray-200'
                                        }`}
                                >
                                    <Icon className="mr-3" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Tab Indicator */}
                    <div className="lg:hidden py-3">
                        <div className="flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-400">
                                {navigationItems.find(item => item.id === tab)?.label}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
                {tab === 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {analytics ? (
                            <>
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center">
                                        <FaUsers className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                                        <div className="ml-3 sm:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-gray-400">Total Users</p>
                                            <p className="text-xl sm:text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center">
                                        <FaChartLine className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                                        <div className="ml-3 sm:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-gray-400">Total Views</p>
                                            <p className="text-xl sm:text-2xl font-bold">{analytics?.overview?.totalViews || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center">
                                        <FaMoneyBillWave className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
                                        <div className="ml-3 sm:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-gray-400">Total Revenue</p>
                                            <p className="text-xl sm:text-2xl font-bold">${analytics?.overview?.totalRevenue || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center">
                                        <FaExclamationTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                                        <div className="ml-3 sm:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-gray-400">Pending Reports</p>
                                            <p className="text-xl sm:text-2xl font-bold">{analytics?.moderation?.pendingReports || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <AnalyticsCardSkeleton />
                                <AnalyticsCardSkeleton />
                                <AnalyticsCardSkeleton />
                                <AnalyticsCardSkeleton />
                            </>
                        )}
                    </div>
                )}

                {tab === 'analytics' && (
                    analytics ? (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold mb-4">Views Over Last 30 Days</h3>
                                <div className="w-full" style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.viewsOver30Days}>
                                            <XAxis dataKey="day" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <RechartsTooltip />
                                            <Bar dataKey="views" fill="#3B82F6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold mb-4">Top Manga</h3>
                                    <div className="space-y-2">
                                        {analytics.topManga?.slice(0, 5).map((manga: any) => (
                                            <div key={manga._id} className="flex justify-between items-center text-sm">
                                                <span className="truncate flex-1 mr-2">{manga.title}</span>
                                                <span className="text-blue-400 font-medium">{manga.views} views</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold mb-4">Top Creators</h3>
                                    <div className="space-y-2">
                                        {analytics.topCreators?.slice(0, 5).map((creator: any) => (
                                            <div key={creator._id} className="flex justify-between items-center text-sm">
                                                <span className="truncate flex-1 mr-2">{creator.nickname}</span>
                                                <span className="text-green-400 font-medium">{creator.totalViews} views</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 animate-pulse" style={{ height: 340 }} />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 animate-pulse" style={{ height: 180 }} />
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 animate-pulse" style={{ height: 180 }} />
                            </div>
                        </div>
                    )
                )}

                {tab === 'moderation' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                            <h2 className="text-lg sm:text-xl font-semibold">Content Reports</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {reports.length === 0 ? (
                                            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                                        ) : (
                                            reports.map((report) => (
                                                <tr key={report._id} className="hover:bg-gray-750">
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{report.type}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{report.reason}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                            <button className="text-blue-400 hover:text-blue-300 transition-colors min-h-[32px] px-2 py-1 rounded">View</button>
                                                            <button className="text-green-400 hover:text-green-300 transition-colors min-h-[32px] px-2 py-1 rounded">Resolve</button>
                                                            <button className="text-red-400 hover:text-red-300 transition-colors min-h-[32px] px-2 py-1 rounded">Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'contact' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                            <h2 className="text-lg sm:text-xl font-semibold">Contact Messages</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]">
                                    <option value="">All Status</option>
                                    <option value="unread">Unread</option>
                                    <option value="read">Read</option>
                                    <option value="replied">Replied</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">From</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {contacts.length === 0 ? (
                                            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                                        ) : (
                                            contacts.map((contact) => (
                                                <tr key={contact._id} className="hover:bg-gray-750">
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                        <div>
                                                            <div className="text-xs sm:text-sm font-medium text-white">{contact.name}</div>
                                                            <div className="text-xs sm:text-sm text-gray-300">{contact.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{contact.subject}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{contact.type}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${contact.status === 'unread' ? 'bg-red-100 text-red-800' :
                                                            contact.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {contact.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                                                        {new Date(contact.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                            <button className="text-blue-400 hover:text-blue-300 transition-colors min-h-[32px] px-2 py-1 rounded">View</button>
                                                            <button className="text-green-400 hover:text-green-300 transition-colors min-h-[32px] px-2 py-1 rounded">Reply</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'users' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                            <h2 className="text-lg sm:text-xl font-semibold">User Management</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
                                />
                                <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]">
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="creator">Creator</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>

                        {/* Upgrade Message */}
                        {upgradeMessage && (
                            <div className={`p-4 rounded-lg ${upgradeMessage.includes('Successfully')
                                    ? 'bg-green-900 border border-green-600 text-green-300'
                                    : 'bg-red-900 border border-red-600 text-red-300'
                                }`}>
                                <div className="flex items-center">
                                    {upgradeMessage.includes('Successfully') ? (
                                        <FaCheckCircle className="mr-2" />
                                    ) : (
                                        <FaExclamationCircle className="mr-2" />
                                    )}
                                    <span>{upgradeMessage}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {users.length === 0 ? (
                                            Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-750">
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                                    <span className="text-xs sm:text-sm font-medium text-white">
                                                                        {(user.nickname || user.email).charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-3 sm:ml-4">
                                                                <div className="text-xs sm:text-sm font-medium text-white">{user.nickname}</div>
                                                                <div className="text-xs sm:text-sm text-gray-300">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{user.role}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBanned ? 'bg-red-100 text-red-800' :
                                                            user.isVerified ? 'bg-green-100 text-green-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {user.isBanned ? 'Banned' : user.isVerified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                            <button className="text-blue-400 hover:text-blue-300 transition-colors min-h-[32px] px-2 py-1 rounded">Edit</button>
                                                            {user.isBanned ? (
                                                                <button className="text-green-400 hover:text-green-300 transition-colors min-h-[32px] px-2 py-1 rounded">Unban</button>
                                                            ) : (
                                                                <button className="text-red-400 hover:text-red-300 transition-colors min-h-[32px] px-2 py-1 rounded">Ban</button>
                                                            )}
                                                            {user.role === 'viewer' && (
                                                                <button
                                                                    onClick={() => handleManualUpgrade(user._id, 'creator')}
                                                                    disabled={upgradingUser === user._id}
                                                                    className="text-yellow-400 hover:text-yellow-300 transition-colors min-h-[32px] px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                                >
                                                                    {upgradingUser === user._id ? (
                                                                        <FaCog className="animate-spin mr-1" />
                                                                    ) : (
                                                                        <FaCrown className="mr-1" />
                                                                    )}
                                                                    {upgradingUser === user._id ? 'Upgrading...' : 'Upgrade to Creator'}
                                                                </button>
                                                            )}
                                                            {user.role === 'creator' && (
                                                                <button
                                                                    onClick={() => handleManualUpgrade(user._id, 'admin')}
                                                                    disabled={upgradingUser === user._id}
                                                                    className="text-purple-400 hover:text-purple-300 transition-colors min-h-[32px] px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                                >
                                                                    {upgradingUser === user._id ? (
                                                                        <FaCog className="animate-spin mr-1" />
                                                                    ) : (
                                                                        <FaShieldAlt className="mr-1" />
                                                                    )}
                                                                    {upgradingUser === user._id ? 'Upgrading...' : 'Upgrade to Admin'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 