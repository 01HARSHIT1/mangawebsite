'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';

interface Report {
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    description: string | null;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    reporterReportCount: number;
}

export default function AdminReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        targetType: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        checkAuth();
        fetchReports();
    }, [filters, page]);

    const checkAuth = async () => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            router.push('/admin/auth/login');
            return;
        }

        try {
            const response = await fetch('/api/admin/auth/verify', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                router.push('/admin/auth/login');
            }
        } catch (error) {
            router.push('/admin/auth/login');
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                ),
            });

            const response = await fetch(`/api/anime/reports?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data.reports);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'text-red-500 bg-red-900/30';
            case 'high':
                return 'text-orange-500 bg-orange-900/30';
            case 'medium':
                return 'text-yellow-500 bg-yellow-900/30';
            case 'low':
                return 'text-green-500 bg-green-900/30';
            default:
                return 'text-gray-500 bg-gray-900/30';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'reviewing':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        }
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            copyright_infringement: 'Copyright Infringement',
            nsfw_sexual_content: 'NSFW / Sexual Content',
            violence_gore: 'Violence / Gore',
            hate_speech: 'Hate Speech',
            harassment_bullying: 'Harassment / Bullying',
            spam_scam: 'Spam / Scam',
            misinformation: 'Misinformation',
            audio_subtitle_mismatch: 'Audio/Subtitles Mismatch',
            spoilers: 'Spoilers',
            other: 'Other',
        };
        return labels[reason] || reason;
    };

    const getTargetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            anime_series: 'Anime Series',
            episode: 'Episode',
            video: 'Video',
            subtitle: 'Subtitle',
            audio_track: 'Audio Track',
            comment: 'Comment',
            user: 'User',
            creator: 'Creator',
            w2g_room: 'W2G Room',
            chat_message: 'Chat Message',
        };
        return labels[type] || type;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Report Management</h1>
                    <p className="text-gray-400">Review and manage user reports</p>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => {
                                    setFilters({ ...filters, status: e.target.value });
                                    setPage(1);
                                }}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => {
                                    setFilters({ ...filters, priority: e.target.value });
                                    setPage(1);
                                }}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            >
                                <option value="">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Target Type</label>
                            <select
                                value={filters.targetType}
                                onChange={(e) => {
                                    setFilters({ ...filters, targetType: e.target.value });
                                    setPage(1);
                                }}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            >
                                <option value="">All Types</option>
                                <option value="episode">Episode</option>
                                <option value="comment">Comment</option>
                                <option value="user">User</option>
                                <option value="w2g_room">W2G Room</option>
                                <option value="chat_message">Chat Message</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: '', priority: '', targetType: '' });
                                    setPage(1);
                                }}
                                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No reports found</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Target</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {report.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>
                                                    <div className="font-semibold">{getTargetTypeLabel(report.targetType)}</div>
                                                    <div className="text-xs text-gray-400">{report.targetId.substring(0, 20)}...</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {getReasonLabel(report.reason)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                                                    {report.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(report.status)}
                                                    <span className="text-sm capitalize">{report.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedReport(report);
                                                    }}
                                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-400">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Report Detail Modal */}
                {selectedReport && (
                    <ReportDetailModal
                        report={selectedReport}
                        onClose={() => setSelectedReport(null)}
                        onAction={() => {
                            setSelectedReport(null);
                            fetchReports();
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Report Detail Modal Component
function ReportDetailModal({
    report,
    onClose,
    onAction,
}: {
    report: Report;
    onClose: () => void;
    onAction: () => void;
}) {
    const [actionType, setActionType] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportDetails, setReportDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportDetails();
    }, [report.id]);

    const fetchReportDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/reports/${report.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReportDetails(data);
            }
        } catch (error) {
            console.error('Error fetching report details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionType) {
            alert('Please select an action');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/reports/${report.id}/actions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    actionType,
                    notes,
                }),
            });

            if (response.ok) {
                alert('Action performed successfully');
                onAction();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to perform action');
            }
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Failed to perform action');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Report Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading report details...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Target Type</label>
                                <p className="text-white">{report.targetType}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Reason</label>
                                <p className="text-white">{report.reason}</p>
                            </div>
                            {report.description && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-400">Description</label>
                                    <p className="text-white">{report.description}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Priority</label>
                                <p className="text-white capitalize">{report.priority}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Status</label>
                                <p className="text-white capitalize">{report.status}</p>
                            </div>
                            {reportDetails && (
                                <>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400">Reporter History</label>
                                        <p className="text-white">{reportDetails.statistics?.reporterReportCount || 0} total reports</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400">Target History</label>
                                        <p className="text-white">{reportDetails.statistics?.targetReportCount || 0} reports on this target</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                            <h3 className="font-semibold mb-4">Take Action</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Action Type</label>
                                    <select
                                        value={actionType}
                                        onChange={(e) => setActionType(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="">Select action...</option>
                                        <optgroup label="Content Actions">
                                            <option value="hide_content">Hide Content</option>
                                            <option value="delete_content">Delete Content</option>
                                        </optgroup>
                                        <optgroup label="User Actions">
                                            <option value="warning">Warning</option>
                                            <option value="strike">Strike</option>
                                            <option value="account_suspension">Account Suspension</option>
                                        </optgroup>
                                        <optgroup label="Report Actions">
                                            <option value="resolve">Resolve</option>
                                            <option value="reject">Reject</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white resize-none"
                                        rows={3}
                                        placeholder="Add notes about this action..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAction}
                                        disabled={isSubmitting || !actionType}
                                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Submit Action'}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

