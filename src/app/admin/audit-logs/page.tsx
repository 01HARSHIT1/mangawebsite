'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaFileAlt, FaSearch, FaFilter, FaDownload, FaCalendarAlt,
    FaUser, FaBan, FaCheckCircle, FaTimes, FaEdit, FaTrash,
    FaShieldAlt, FaMoneyBillWave, FaGavel, FaChartBar
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AuditLog {
    _id: string;
    adminId: string;
    adminEmail: string;
    adminUsername: string;
    action: string;
    targetId?: string;
    targetUserId?: string;
    targetUserEmail?: string;
    details: any;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
}

interface AuditStats {
    total: number;
    last24h: number;
    last7d: number;
}

export default function AuditLogsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [actionCounts, setActionCounts] = useState<Array<{ action: string; count: number }>>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        adminId: '',
        targetId: '',
        dateFrom: '',
        dateTo: '',
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchLogs();
    }, [isAuthenticated, user, router, page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
            });
            if (filters.action) params.append('action', filters.action);
            if (filters.adminId) params.append('adminId', filters.adminId);
            if (filters.targetId) params.append('targetId', filters.targetId);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            
            const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setStats(data.stats || null);
                setActionCounts(data.actionCounts || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/audit-logs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    action: filters.action,
                })
            });

            if (response.ok) {
                const data = await response.json();
                const blob = new Blob([data.csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                alert(`Exported ${data.recordCount} audit log records`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            alert('Failed to export audit logs');
        } finally {
            setExporting(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('login')) return <FaUser className="text-blue-400" />;
        if (action.includes('ban') || action.includes('suspend')) return <FaBan className="text-red-400" />;
        if (action.includes('approve') || action.includes('verify')) return <FaCheckCircle className="text-green-400" />;
        if (action.includes('payout') || action.includes('revenue')) return <FaMoneyBillWave className="text-yellow-400" />;
        if (action.includes('copyright') || action.includes('legal')) return <FaGavel className="text-purple-400" />;
        if (action.includes('delete') || action.includes('remove')) return <FaTrash className="text-red-400" />;
        if (action.includes('role') || action.includes('permission')) return <FaShieldAlt className="text-orange-400" />;
        if (action.includes('analytics') || action.includes('report')) return <FaChartBar className="text-blue-400" />;
        return <FaFileAlt className="text-gray-400" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes('login')) return 'bg-blue-900/30 border-blue-500/30';
        if (action.includes('ban') || action.includes('suspend')) return 'bg-red-900/30 border-red-500/30';
        if (action.includes('approve') || action.includes('verify')) return 'bg-green-900/30 border-green-500/30';
        if (action.includes('payout') || action.includes('revenue')) return 'bg-yellow-900/30 border-yellow-500/30';
        if (action.includes('copyright') || action.includes('legal')) return 'bg-purple-900/30 border-purple-500/30';
        if (action.includes('delete') || action.includes('remove')) return 'bg-red-900/30 border-red-500/30';
        if (action.includes('role') || action.includes('permission')) return 'bg-orange-900/30 border-orange-500/30';
        return 'bg-gray-900/30 border-gray-500/30';
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
                        <p className="text-gray-400">Complete audit trail of all admin actions</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                        <FaDownload />
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <FaFileAlt className="text-gray-400 text-2xl" />
                                <span className="text-sm text-gray-400">Total Logs</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <FaCalendarAlt className="text-blue-400 text-2xl" />
                                <span className="text-sm text-gray-400">Last 24 Hours</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.last24h.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <FaChartBar className="text-orange-400 text-2xl" />
                                <span className="text-sm text-gray-400">Last 7 Days</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.last7d.toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {/* Top Actions */}
                {actionCounts.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                        <h3 className="text-xl font-bold mb-4">Most Common Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {actionCounts.map((item) => (
                                <div
                                    key={item.action}
                                    className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
                                >
                                    <span className="text-sm font-semibold text-white">{item.action}</span>
                                    <span className="text-xs text-gray-400">({item.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FaFilter />
                        Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Action</label>
                            <input
                                type="text"
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                placeholder="e.g., admin_login, user_ban"
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Admin ID</label>
                            <input
                                type="text"
                                value={filters.adminId}
                                onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
                                placeholder="Admin user ID"
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Date From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Date To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setFilters({ action: '', adminId: '', targetId: '', dateFrom: '', dateTo: '' })}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Logs List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <FaFileAlt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No audit logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800 border-b border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Admin</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Target</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr
                                                key={log._id}
                                                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-4 text-sm text-gray-300">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="font-semibold text-white">{log.adminUsername}</div>
                                                        <div className="text-xs text-gray-400">{log.adminEmail}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getActionColor(log.action)}`}>
                                                        {getActionIcon(log.action)}
                                                        <span className="text-white">{log.action}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-300">
                                                    {log.targetUserEmail && (
                                                        <div>
                                                            <div>User: {log.targetUserEmail}</div>
                                                        </div>
                                                    )}
                                                    {log.targetId && (
                                                        <div className="text-xs text-gray-500">ID: {log.targetId.slice(0, 8)}...</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-400">
                                                    {log.ipAddress || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Log Details Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Audit Log Details</h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Timestamp</div>
                                    <div className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                                </div>

                                <div className="p-4 bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Admin</div>
                                    <div className="text-white font-semibold">{selectedLog.adminUsername}</div>
                                    <div className="text-xs text-gray-400">{selectedLog.adminEmail}</div>
                                    <div className="text-xs text-gray-500 mt-1">ID: {selectedLog.adminId}</div>
                                </div>

                                <div className="p-4 bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Action</div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getActionColor(selectedLog.action)}`}>
                                        {getActionIcon(selectedLog.action)}
                                        <span className="text-white">{selectedLog.action}</span>
                                    </div>
                                </div>

                                {selectedLog.targetUserId && (
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Target User</div>
                                        <div className="text-white">{selectedLog.targetUserEmail}</div>
                                        <div className="text-xs text-gray-500 mt-1">ID: {selectedLog.targetUserId}</div>
                                    </div>
                                )}

                                {selectedLog.targetId && (
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Target ID</div>
                                        <div className="text-white font-mono text-sm">{selectedLog.targetId}</div>
                                    </div>
                                )}

                                <div className="p-4 bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">IP Address</div>
                                    <div className="text-white">{selectedLog.ipAddress || 'N/A'}</div>
                                </div>

                                <div className="p-4 bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">User Agent</div>
                                    <div className="text-white text-sm">{selectedLog.userAgent || 'N/A'}</div>
                                </div>

                                {Object.keys(selectedLog.details).length > 0 && (
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-2">Details</div>
                                        <pre className="text-white text-xs bg-gray-900 p-3 rounded overflow-x-auto">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
