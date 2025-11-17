'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaComments, FaStar, FaFlag, FaTrash, FaBan, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import Link from 'next/link';

interface Comment {
    _id: string;
    content: string;
    userId: string;
    username: string;
    mangaId?: string;
    chapterId?: string;
    createdAt: string;
    isDeleted: boolean;
}

export default function AdminCommunityPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'comments' | 'ratings' | 'reports'>('comments');
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Fetch comments
            const commentsRes = await fetch('/api/admin/community/comments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData.comments || []);
            }

            // Fetch reports
            const reportsRes = await fetch('/api/admin/reports?status=pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (reportsRes.ok) {
                const reportsData = await reportsRes.json();
                setReports(reportsData.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch community data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/admin/community/comments?id=${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setComments(comments.filter(c => c._id !== commentId));
            } else {
                alert('Failed to delete comment');
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('Failed to delete comment');
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
                        Community Tools
                    </h1>
                    <p className="text-gray-400">Moderate comments, manage ratings, and handle reports</p>
                </div>

                <div className="flex gap-2 mb-6 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-2 ${activeTab === 'comments' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Comments
                    </button>
                    <button
                        onClick={() => setActiveTab('ratings')}
                        className={`px-4 py-2 ${activeTab === 'ratings' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Ratings
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 ${activeTab === 'reports' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Reports
                    </button>
                </div>

                {activeTab === 'comments' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Comment Moderation ({comments.length})</h2>
                        {comments.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No comments to moderate</div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment._id} className="bg-slate-700/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold">{comment.username}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300">{comment.content}</p>
                                                {comment.mangaId && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Manga ID: {comment.mangaId}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="p-2 text-red-400 hover:text-red-300"
                                                title="Delete Comment"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ratings' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Rating Management</h2>
                        <div className="text-gray-400">Rating fraud detection and management coming soon...</div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">User Reports ({reports.length})</h2>
                        {reports.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No reports to review</div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report: any) => (
                                    <div key={report._id} className="bg-slate-700/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaFlag className="text-red-400" />
                                                    <span className="font-semibold">{report.type}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                                                        'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                        {report.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 mb-2">{report.reason}</p>
                                                {report.description && (
                                                    <p className="text-sm text-gray-400 mb-2">{report.description}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Target: {report.targetType} - {report.targetId}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/admin/moderation`}
                                                    className="p-2 text-blue-400 hover:text-blue-300"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

