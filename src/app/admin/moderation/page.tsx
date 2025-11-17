'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaExclamationTriangle, FaCheck, FaTimes, FaEye, FaBan, FaFlag } from 'react-icons/fa';

interface Report {
    _id: string;
    type: string;
    reason: string;
    status: 'pending' | 'resolved' | 'rejected';
    reporterId: string;
    reporterUsername?: string;
    targetId: string;
    targetType: 'manga' | 'chapter' | 'comment' | 'user';
    description?: string;
    createdAt: string;
    adminNotes?: string;
}

export default function AdminModerationPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchReports();
    }, [isAuthenticated, user, router, filterStatus]);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/reports?status=${filterStatus === 'all' ? '' : filterStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReport = async (reportId: string, status: 'resolved' | 'rejected', adminNotes?: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/reports`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    _id: reportId,
                    status,
                    adminNotes
                })
            });

            if (response.ok) {
                fetchReports();
                setSelectedReport(null);
            }
        } catch (error) {
            console.error('Failed to update report:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Content Moderation
                    </h1>
                    <p className="text-gray-400">Review and manage content reports</p>
                </div>

                <div className="mb-4 flex gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    >
                        <option value="all">All Reports</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{report.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-400">{report.targetType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                                report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="p-2 text-blue-400 hover:text-blue-300"
                                                >
                                                    <FaEye />
                                                </button>
                                                {report.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateReport(report._id, 'resolved')}
                                                            className="p-2 text-green-400 hover:text-green-300"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateReport(report._id, 'rejected')}
                                                            className="p-2 text-red-400 hover:text-red-300"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Report Detail Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Report Details</h2>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400">Type</label>
                                    <p className="text-white">{selectedReport.type}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Reason</label>
                                    <p className="text-white">{selectedReport.reason}</p>
                                </div>
                                {selectedReport.description && (
                                    <div>
                                        <label className="text-sm text-gray-400">Description</label>
                                        <p className="text-white">{selectedReport.description}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm text-gray-400">Target</label>
                                    <p className="text-white">{selectedReport.targetType}: {selectedReport.targetId}</p>
                                </div>
                                {selectedReport.status === 'pending' && (
                                    <div className="flex gap-2 pt-4">
                                        <button
                                            onClick={() => handleUpdateReport(selectedReport._id, 'resolved')}
                                            className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                                        >
                                            <FaCheck className="inline mr-2" />
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateReport(selectedReport._id, 'rejected')}
                                            className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                                        >
                                            <FaTimes className="inline mr-2" />
                                            Reject
                                        </button>
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

