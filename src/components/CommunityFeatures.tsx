"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaHeart, FaComment, FaStar, FaThumbsUp, FaShare, FaReply, FaEdit, FaTrash, FaUser, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Comment[object Object]
    _id: string;
    userId: string;
    user: {
        _id: string;
        nickname: string;
        avatarUrl?: string;
        role: string;
        verified?: boolean;
    };
    content: string;
    rating?: number;
    likes: string[];
    replies: Reply createdAt: string;
    updatedAt?: string;
}

interface Reply[object Object]
    _id: string;
    userId: string;
    user: {
        _id: string;
        nickname: string;
        avatarUrl?: string;
        role: string;
    };
    content: string;
    likes: string createdAt: string;
}

interface CommunityFeaturesProps {
    mangaId: string;
    currentUser?: any;
}

export default function CommunityFeatures({ mangaId, currentUser }: CommunityFeaturesProps) {
    const [comments, setComments] = useState<Comment>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const rating, setRating] = useState(0);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState(    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    consterror, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const sortBy, setSortBy] = useState<newest' | oldest' |rating' | 'likes>(newest');

    // Fetch comments
    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manga/$[object Object]mangaId}/comments?sort=${sortBy}`);
            if (res.ok)[object Object]             const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error('Failed to fetch comments:', err);
            setError('Failed to load comments');
        } finally[object Object]        setLoading(false);
        }
    }, [mangaId, sortBy]);

    // Submit new comment
    const handleSubmitComment = async () => {
        if (!currentUser || !newComment.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token);
            if (!token) throw new Error('You must be logged in to comment');

            const res = await fetch(`/api/manga/${mangaId}/comments`,[object Object]            method: 'POST,           headers: {
                   Content-Type':application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newComment.trim(),
                    rating: rating > 0 ? rating : undefined
                })
            });

            if (!res.ok)[object Object]             const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to post comment');
            }

            setNewComment('');
            setRating(0);
            setSuccess('Comment posted successfully!');
            setTimeout(() => setSuccess(null), 3000
            fetchComments();
        } catch (err)[object Object]          setError(err instanceof Error ? err.message : 'Failed to post comment');
            setTimeout(() => setError(null), 5000);
        } finally[object Object]            setSubmitting(false);
        }
    };

    // Handle like/unlike comment
    const handleLikeComment = async (commentId: string) => {
        if (!currentUser) return;

        try {
            const token = localStorage.getItem('token);
            if (!token) throw new Error('You must be logged in to like comments');

            const comment = comments.find(c => c._id === commentId);
            if (!comment) return;

            const isLiked = comment.likes.includes(currentUser._id);
            const method = isLiked ? 'DELETE' : 'POST';

            const res = await fetch(`/api/manga/${mangaId}/comments/${commentId}/like`,[object Object]            method,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok)[object Object]               setComments(prev => prev.map(c => 
                    c._id === commentId 
                        ? { ...c, likes: isLiked 
                            ? c.likes.filter(id => id !== currentUser._id)
                            : [...c.likes, currentUser._id]
                        }
                        : c
                ));
            }
        } catch (err) {
            console.error('Failed to like comment:', err);
        }
    };

    // Handle reply to comment
    const handleSubmitReply = async (commentId: string) => {
        if (!currentUser || !replyContent.trim()) return;

        try {
            const token = localStorage.getItem('token);
            if (!token) throw new Error('You must be logged in to reply');

            const res = await fetch(`/api/manga/${mangaId}/comments/${commentId}/replies`,[object Object]            method: 'POST,           headers: {
                   Content-Type':application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: replyContent.trim() })
            });

            if (res.ok)[object Object]               setReplyContent('');
                setReplyTo(null);
                setSuccess('Reply posted successfully!');
                setTimeout(() => setSuccess(null), 3000);
                fetchComments();
            }
        } catch (err)[object Object]          setError(err instanceof Error ? err.message : 'Failed to post reply');
            setTimeout(() => setError(null),500        }
    };

    // Handle edit comment
    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            const token = localStorage.getItem('token);
            if (!token) throw new Error('You must be logged in to edit comments');

            const res = await fetch(`/api/manga/${mangaId}/comments/${commentId}`,[object Object]            method: 'PUT,           headers: {
                   Content-Type':application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent.trim() })
            });

            if (res.ok)[object Object]               setEditingComment(null);
                setEditContent('');
                setSuccess('Comment updated successfully!');
                setTimeout(() => setSuccess(null), 3000);
                fetchComments();
            }
        } catch (err)[object Object]          setError(err instanceof Error ? err.message :Failed to update comment');
            setTimeout(() => setError(null),500        }
    };

    // Handle delete comment
    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('token);
            if (!token) throw new Error('You must be logged in to delete comments');

            const res = await fetch(`/api/manga/${mangaId}/comments/${commentId}`,[object Object]            method: 'DELETE,           headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok)[object Object]               setComments(prev => prev.filter(c => c._id !== commentId));
                setSuccess('Comment deleted successfully!');
                setTimeout(() => setSuccess(null), 3000         }
        } catch (err)[object Object]          setError(err instanceof Error ? err.message :Failed to delete comment');
            setTimeout(() => setError(null),500        }
    };

    // Load comments on mount and when sort changes
    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60;
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24turn `${Math.floor(diffInHours)}h ago`;
        if (diffInHours < 168turn `${Math.floor(diffInHours / 24o`;
        return date.toLocaleDateString();
    };

    const getUserRoleIcon = (role: string, verified?: boolean) => [object Object]      if (role ===admin') return <FaUser className="text-yellow-400title="Admin />;
        if (role ===creator') return <FaUser className="text-blue-400title="Creator />;      if (verified) return <FaUser className="text-green-400 title="Verified" />;
        return <FaUser className="text-gray-400 title="User" />;
    };

    return (
        <div className="bg-gray-900 rounded-2l shadow-xl p-6>        {/* Header */}
            <div className=flex items-center justify-between mb-6>
                <h2 className="text-2nt-bold text-white">Community</h2
                <div className=flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-gray-800 text-white rounded-lg px-3 py-1 text-sm border border-gray-700"
                    >
                        <option value="newest>Newest</option>                   <option value="oldest>Oldest</option>                   <option value=rating">Top Rated</option>
                        <option value=likes">Most Liked</option>
                    </select>
                </div>
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={[object Object]opacity: 0, y: -20 }}
                        animate=[object Object]{ opacity: 1, y: 0 }}
                        exit={[object Object]opacity: 0, y: -20 }}
                        className=mb-4 bg-green-60text-white px-4-2nded-lg flex items-center gap-2"
                    >
                        <FaCheckCircle />
                        {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={[object Object]opacity: 0, y: -20 }}
                        animate=[object Object]{ opacity: 1, y: 0 }}
                        exit={[object Object]opacity: 0, y: -20 }}
                        className="mb-4red-60text-white px-4-2nded-lg flex items-center gap-2"
                    >
                        <FaExclamationTriangle />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Comment Form */}
            {currentUser && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className=w-10 h-10unded-full bg-blue-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                       [object Object]currentUser.avatarUrl ? (
                                <Image
                                    src={currentUser.avatarUrl}
                                    alt={currentUser.nickname}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                currentUser.nickname?.charAt(0)?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className=flex-1 min-w-0                   <div className="mb-3">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts about this manga..."
                                    className="w-full bg-gray-700 text-white rounded-lg p-3 resize-none focus:ring-2ocus:ring-blue-500focus:outline-none"
                                    rows={3}
                                    maxLength={1000}
                                />
                                <div className="text-right text-sm text-gray-400 mt-1">
                                    {newComment.length}/1000
                                </div>
                            </div>
                            
                            {/* Rating */}
                            <div className=flex items-center gap-2 mb-3">
                                <span className=text-sm text-gray-300                   <div className="flex gap-1">
                                    {[123, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`text-xl transition-colors ${
                                                star <= rating ?text-yellow-400 : ext-gray-500 hover:text-yellow-400'
                                            }`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={submitting || !newComment.trim()}
                                    className=px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-60isabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <FaSpinner className=animate-spin                   ) : (
                                        <FaComment />
                                    )}
                                 [object Object]submitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <FaSpinner className=animate-spin text-3text-blue-400" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <div className=text-4xl mb-2">💬</div>
                    <p className=text-gray-400>No comments yet</p>
                    <p className=text-sm text-gray-500the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment, index) => (
                        <motion.div
                            key={comment._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate=[object Object]{ opacity: 1, y: 0 }}
                            transition=[object Object][object Object] delay: index * 0.1 }}
                            className="bg-gray-800                   >
                            {/* Comment Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className=w-10 h-10unded-full bg-blue-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {comment.user.avatarUrl ? (
                                        <Image
                                            src={comment.user.avatarUrl}
                                            alt={comment.user.nickname}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        comment.user.nickname?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className=flex-1 min-w-0                   <div className=flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-white truncate">
                                            {comment.user.nickname}
                                        </span>
                                        {getUserRoleIcon(comment.user.role, comment.user.verified)}
                                        {comment.rating && (
                                            <div className=flex items-center gap-1">
                                                <FaStar className="text-yellow-400 text-sm" />
                                                <span className="text-sm text-yellow-400{comment.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className=text-sm text-gray-400">
                                  [object Object]formatDate(comment.createdAt)}
                                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                            <span className="ml-2>(edited)</span>                   )}
                                    </div>
                                </div>
                                
                         [object Object]/* Comment Actions */}
                                {currentUser && (currentUser._id === comment.userId || currentUser.role === 'admin') && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingComment(comment._id);
                                                setEditContent(comment.content);
                                            }}
                                            className="text-gray-400over:text-blue-400 transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="text-gray-40hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>

                     [object Object]/* Comment Content */}
                         [object Object]editingComment === comment._id ? (
                                <div className="mb-3">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-lg p-3 resize-none focus:ring-2ocus:ring-blue-500focus:outline-none"
                                        rows={3}
                                        maxLength={1000}
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleEditComment(comment._id)}
                                            className=px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingComment(null);
                                                setEditContent('');
                                            }}
                                            className=px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <p className=text-white whitespace-pre-wrap>{comment.content}</p>
                                </div>
                            )}

                     [object Object]/* Comment Actions */}
                            <div className=flex items-center gap-4 text-sm">
                                <button
                                    onClick={() => handleLikeComment(comment._id)}
                                    className={`flex items-center gap-1 transition-colors ${
                                        currentUser && comment.likes.includes(currentUser._id)
                                            ? 'text-red-400'
                                            : 'text-gray-40hover:text-red-400'
                                    }`}
                                >
                                    <FaHeart />
                                    {comment.likes.length}
                                </button>
                                
                                <button
                                    onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                                    className=flex items-center gap-1 text-gray-400over:text-blue-400 transition-colors"
                                >
                                    <FaReply />
                                    Reply
                                </button>
                                
                                <button className=flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                                    <FaShare />
                                    Share
                                </button>
                            </div>

                        [object Object]/* Reply Form */}
                            {replyTo === comment._id && currentUser && (
                                <div className="mt-4 bg-gray-700 rounded-lg p-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8-8nded-full bg-green-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                       [object Object]currentUser.avatarUrl ? (
                                                <Image
                                                    src={currentUser.avatarUrl}
                                                    alt={currentUser.nickname}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                currentUser.nickname?.charAt(0)?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className=flex-1 min-w-0                   <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Write a reply..."
                                                className="w-full bg-gray-600 text-white rounded-lg p-2 resize-none focus:ring-2 focus:ring-green-500focus:outline-none text-sm"
                                                rows={2}
                                                maxLength={500}
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleSubmitReply(comment._id)}
                                                    disabled={!replyContent.trim()}
                                                    className="px-3 py-1 bg-green-60hover:bg-green-500 disabled:bg-gray-60isabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                                                >
                                                    Reply
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setReplyTo(null);
                                                        setReplyContent('');
                                                    }}
                                                    className=px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                          [object Object]comment.replies && comment.replies.length > 0 && (
                                <div className=mt-4 space-y-3                   {comment.replies.map((reply) => (
                                        <div key={reply._id} className="bg-gray-700 rounded-lg p-3 ml-8">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="w-8-8nded-full bg-green-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {reply.user.avatarUrl ? (
                                                        <Image
                                                            src={reply.user.avatarUrl}
                                                            alt={reply.user.nickname}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        reply.user.nickname?.charAt(0)?.toUpperCase() || 'U'
                                                    )}
                                                </div>
                                                <div className=flex-1 min-w-0                   <div className=flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-white text-sm truncate">
                                                            {reply.user.nickname}
                                                        </span>
                                                      [object Object]getUserRoleIcon(reply.user.role)}
                                                    </div>
                                                    <div className=text-xs text-gray-400">
                                                        {formatDate(reply.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-white text-sm whitespace-pre-wrap">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
} 