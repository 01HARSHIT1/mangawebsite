'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaComment, FaTrash, FaCheck, FaTimes, FaEye, FaFilter,
    FaExclamationTriangle, FaUser
} from 'react-icons/fa';
import DashboardLayout from './DashboardLayout';
import Link from 'next/link';

interface Comment {
    _id: string;
    content: string;
    username: string;
    userId: string;
    mangaId?: string;
    mangaTitle?: string;
    chapterId?: string;
    chapterTitle?: string;
    createdAt: string;
    status: 'visible' | 'hidden' | 'flagged';
}

export default function CommentModerationPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'flagged' | 'hidden'>('all');

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Fetch all comments on creator's manga
            const response = await fetch('/api/creator/comments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setComments(comments.filter(c => c._id !== commentId));
                alert('Comment deleted successfully!');
            } else {
                alert('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    };

    const handleToggleVisibility = async (commentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setComments(comments.map(c => 
                    c._id === commentId ? { ...c, status: newStatus as any } : c
                ));
            } else {
                alert('Failed to update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Failed to update comment');
        }
    };

    const filteredComments = comments.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Comment Moderation</h1>
                        <p className="text-gray-400">Manage user comments and feedback on your content</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-3">
                    <FaFilter className="text-gray-400" />
                    {(['all', 'flagged', 'hidden'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                filter === f
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-slate-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Comments List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
                                <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredComments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredComments.map((comment, index) => (
                            <motion.div
                                key={comment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-slate-800/50 rounded-xl p-6 border transition-all ${
                                    comment.status === 'flagged' 
                                        ? 'border-red-500/50' 
                                        : comment.status === 'hidden'
                                        ? 'border-yellow-500/50'
                                        : 'border-slate-700/50'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">
                                                {comment.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{comment.username || 'Anonymous'}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {comment.status === 'flagged' && (
                                        <div className="flex items-center space-x-2 bg-red-900/30 px-3 py-1 rounded-full">
                                            <FaExclamationTriangle className="text-red-400 text-sm" />
                                            <span className="text-xs font-semibold text-red-400">Flagged</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-300 mb-4">{comment.content}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                    <div className="text-sm text-gray-400">
                                        {comment.mangaTitle && (
                                            <Link 
                                                href={`/manga/${comment.mangaId}`}
                                                className="hover:text-purple-400 transition-colors"
                                            >
                                                {comment.mangaTitle}
                                                {comment.chapterTitle && ` • ${comment.chapterTitle}`}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleVisibility(comment._id, comment.status)}
                                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                                                comment.status === 'visible'
                                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {comment.status === 'visible' ? <FaTimes /> : <FaCheck />}
                                            <span>{comment.status === 'visible' ? 'Hide' : 'Show'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors"
                                        >
                                            <FaTrash />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Comments</h3>
                        <p className="text-gray-400">
                            {filter !== 'all' 
                                ? `No ${filter} comments found`
                                : 'No comments on your manga yet'
                            }
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

