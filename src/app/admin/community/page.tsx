'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaComments, FaStar, FaFlag, FaTrash, FaBan, FaCheck, FaTimes } from 'react-icons/fa';

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
            // Fetch comments and reports
            // Mock data for now
            setComments([]);
            setReports([]);
        } catch (error) {
            console.error('Failed to fetch community data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            // Delete comment via API
            setComments(comments.filter(c => c._id !== commentId));
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
                        <h2 className="text-xl font-bold mb-4">Comment Moderation</h2>
                        <div className="text-gray-400">
                            {comments.length === 0 ? 'No comments to moderate' : `${comments.length} comments`}
                        </div>
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
                        <h2 className="text-xl font-bold mb-4">User Reports</h2>
                        <div className="text-gray-400">
                            {reports.length === 0 ? 'No reports to review' : `${reports.length} reports pending`}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

