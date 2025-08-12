"use client";
import { useState, useEffect, useRef } from 'react';
import { FaHeart, FaReply, FaFlag, FaEdit, FaTrash, FaSmile, FaThumbsUp, FaThumbsDown, FaStar, FaUser, FaCrown, FaShieldAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
    _id: string;
    text: string;
    user: {
        _id: string;
        nickname: string;
        avatarUrl?: string;
        role: string;
        verified?: boolean;
    };
    createdAt: string;
    likes: string[];
    dislikes: string;
    reactions: { [key: string]: string  replies: Comment parentId?: string;
    edited?: boolean;
    editedAt?: string;
    reported?: boolean;
}

interface EnhancedCommentsProps {
    contentId: string;
    contentType: manga | pter;
    currentUser?: any;
}

export default function EnhancedComments({ contentId, contentType, currentUser }: EnhancedCommentsProps) {
    const [comments, setComments] = useState<Comment>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showReactions, setShowReactions] = useState<string | null>(null);
    const sortBy, setSortBy] = useState<newest' | 'oldest' | popular'>('newest');
    const [filterBy, setFilterBy] = useState<'all' |top |recent'>('all');
    const [showReportModal, setShowReportModal] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState(');    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const reactionTypes =[object Object]
        👍thumbsup,   ❤️: heart,
     😂: laugh,
   😮': wow,
   😢': sad,     😡: angry',
     ⭐:star };

    useEffect(() => {
        fetchComments();
    }, contentId, sortBy, filterBy]);

    const fetchComments = async () => {
        try {
            const endpoint = contentType === 'manga'
                ? `/api/comments?mangaId=${contentId}&sort=${sortBy}&filter=${filterBy}`
                : `/api/chapters/${contentId}/comments?sort=${sortBy}&filter=${filterBy}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (err)[object Object]          setError('Failed to load comments');
        }
    };

    const handlePost = async () => [object Object]   if (!newComment.trim()) return;
        setLoading(true);
        setError('');
        setSuccess(       const token = localStorage.getItem('token');
        if (!token)[object Object]          setError('You must be logged in to comment.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = contentType === 'manga'
                ? '/api/comments'
                : `/api/chapters/${contentId}/comments`;
            
            const body = contentType === 'manga'
                ? [object Object]mangaId: contentId, text: newComment, parentId: replyTo }
                : [object Object] text: newComment, parentId: replyTo };

            const res = await fetch(endpoint,[object Object]            method: 'POST,           headers:[object Object]Content-Type':application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            
            if (!res.ok)[object Object]               setError(data.error || 'Failed to post comment');
            } else[object Object]               setSuccess('Comment posted!');
                setComments(c => data.comment, ...c]);
                setNewComment('');
                setReplyTo(null);
                setTimeout(() => setSuccess(''), 1200         }
        } catch (err)[object Object]          setError('Failed to post comment');
        }
        setLoading(false);
    };

    const handleEdit = async (commentId: string, newText: string) => [object Object]      if (!newText.trim()) return;
        setLoading(true);
        setError(       const token = localStorage.getItem('token');
        if (!token)[object Object]          setError('You must be logged in to edit.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = contentType === 'manga'
                ? `/api/comments/${commentId}`
                : `/api/chapters/${contentId}/comments/${commentId}`;

            const res = await fetch(endpoint,[object Object]            method: 'PATCH,           headers:[object Object]Content-Type':application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: newText }),
            });

            const data = await res.json();
            
            if (!res.ok)[object Object]               setError(data.error || 'Failed to edit comment');
            } else[object Object]               setComments(c => c.map(comment => 
                    comment._id === commentId 
                        ? [object Object] ...comment, text: newText, edited: true, editedAt: new Date().toISOString() }
                        : comment
                ));
                setEditingComment(null);
                setSuccess('Comment updated!');
                setTimeout(() => setSuccess(''), 1200         }
        } catch (err)[object Object]          setError('Failed to edit comment');
        }
        setLoading(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        setLoading(true);
        setError(       const token = localStorage.getItem('token');
        if (!token)[object Object]          setError('You must be logged in to delete.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = contentType === 'manga'
                ? `/api/comments/${commentId}`
                : `/api/chapters/${contentId}/comments/${commentId}`;

            const res = await fetch(endpoint,[object Object]            method: 'DELETE,           headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok)[object Object]             const data = await res.json();
                setError(data.error ||Failed to delete comment');
            } else[object Object]               setComments(c => c.filter(comment => comment._id !== commentId));
                setSuccess('Comment deleted!');
                setTimeout(() => setSuccess(''), 1200         }
        } catch (err)[object Object]          setError('Failed to delete comment');
        }
        setLoading(false);
    };

    const handleReaction = async (commentId: string, reactionType: string) => {
        const token = localStorage.getItem('token');
        if (!token)[object Object]          setError('You must be logged in to react.');
            return;
        }

        try {
            const endpoint = contentType === 'manga'
                ? `/api/comments/${commentId}/reactions`
                : `/api/chapters/${contentId}/comments/${commentId}/reactions`;

            const res = await fetch(endpoint,[object Object]            method: 'POST,           headers:[object Object]Content-Type':application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reactionType }),
            });

            if (res.ok)[object Object]               setComments(c => c.map(comment => {
                    if (comment._id === commentId) {
                        const newReactions = { ...comment.reactions };
                        const userReactions = newReactions[reactionType] || [];
                        const userId = currentUser?._id;
                        
                        if (userReactions.includes(userId)) {
                            newReactions[reactionType] = userReactions.filter(id => id !== userId);
                        } else {
                            newReactions[reactionType] = [...userReactions, userId];
                        }
                        
                        return { ...comment, reactions: newReactions };
                    }
                    return comment;
                }));
            }
        } catch (err)[object Object]          setError('Failed to add reaction');
        }
    };

    const handleReport = async (commentId: string) => {
        if (!reportReason.trim()) return;
        setLoading(true);
        setError(       const token = localStorage.getItem('token');
        if (!token)[object Object]          setError('You must be logged in to report.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(/api/reports[object Object]            method: 'POST,           headers:[object Object]Content-Type':application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    contentType: 'comment',
                    contentId: commentId,
                    reason: reportReason,
                    details: `Comment on ${contentType}: ${contentId}`
                }),
            });

            if (!res.ok)[object Object]             const data = await res.json();
                setError(data.error ||Failed to report comment');
            } else[object Object]               setSuccess('Comment reported successfully');
                setShowReportModal(null);
                setReportReason('');
                setTimeout(() => setSuccess(''), 1200         }
        } catch (err)[object Object]          setError('Failed to report comment');
        }
        setLoading(false);
    };

    const formatText = (text: string) => {
        // Convert @mentions to links
        text = text.replace(/@(\w+)/g, <span class="text-blue-400 font-semibold">@$1</span>');
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1get="_blank class="text-blue-400 underline">$1</a>');
        // Convert **bold** to bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert *italic* to italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>);       return text;
    };

    const getUserRoleIcon = (role: string, verified?: boolean) => [object Object]      if (role ===admin) return<FaCrown className="text-yellow-400title="Admin />;
        if (role ===creator') return <FaShieldAlt className="text-blue-400title="Creator />;      if (verified) return <FaStar className="text-green-400 title="Verified" />;
        return <FaUser className="text-gray-400 title="User" />;
    };

    const canModerate = (comment: Comment) => {
        return currentUser && (
            currentUser.role === 'admin' || 
            currentUser.role === 'creator' || 
            comment.user._id === currentUser._id
        );
    };

    const renderComment = (comment: Comment, isReply = false) => (
        <motion.div
            key={comment._id}
            initial={{ opacity: 0, y:20           animate=[object Object]{ opacity: 1, y: 0 }}
            exit={[object Object]opacity: 0, y: -20         className={`bg-gray-800nded-lg p-4 shadow-lg ${isReply ? 'ml-8 border-l-2border-blue-500: ''}`}
        >
            <div className="flex gap-3 items-start>               {/* User Avatar */}
                <div className="flex-shrink-0">
                    <div className=w-10 h-10unded-full bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-300 relative">
                        {comment.user.avatarUrl ? (
                            <img src={comment.user.avatarUrl} alt=avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            comment.user.nickname?.0?.toUpperCase() || 'U'
                        )}
                        <div className=absolute -bottom-1 -right-1">
                            {getUserRoleIcon(comment.user.role, comment.user.verified)}
                        </div>
                    </div>
                </div>

         [object Object]/* Comment Content */}
                <div className=flex-1 min-w-0                   <div className=flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-200{comment.user.nickname}</span>
                        <span className=text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleString()}
                            {comment.edited && <span className="ml-1-gray-500>(edited)</span>}
                        </span>
                    </div>

                 [object Object]editingComment === comment._id ? (
                        <div className="mb-3">
                            <textarea
                                defaultValue={comment.text}
                                className="w-full px-3-2ounded bg-gray-700 text-white focus:ring-2ocus:ring-blue-400focus:outline-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handleEdit(comment._id, (document.querySelector(`textarea[data-comment="${comment._id}"]`) as HTMLTextAreaElement)?.value || '')}
                                    className=px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingComment(null)}
                                    className=px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className=text-gray-20b-3 whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: formatText(comment.text) }}
                        />
                    )}

                    {/* Reactions */}
                    <div className=flex items-center gap-4 mb-3">
                        <div className=flex items-center gap-1">
                            {Object.entries(reactionTypes).map(([emoji, type]) => {
                                const count = comment.reactions?.type]?.length || 0;
                                const hasReacted = comment.reactions?.[type]?.includes(currentUser?._id);
                                return count > 0 && (
                                    <button
                                        key={type}
                                        onClick={() => handleReaction(comment._id, type)}
                                        className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                            hasReacted 
                                                ?bg-blue-600 text-white'
                                                :bg-gray-700ext-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {emoji} {count}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className=flex items-center gap-2">
                            <button
                                onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                                className=flex items-center gap-1 px-2py-1 text-gray-400over:text-blue-400 text-sm transition-colors"
                            >
                                <FaReply /> Reply
                            </button>
                            
                            {canModerate(comment) && (
                                <>
                                    <button
                                        onClick={() => setEditingComment(comment._id)}
                                        className=flex items-center gap-1 px-2py-1 text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment._id)}
                                        className=flex items-center gap-1 px-2py-1 text-gray-40hover:text-red-400 text-sm transition-colors"
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setShowReactions(showReactions === comment._id ? null : comment._id)}
                                className=flex items-center gap-1 px-2py-1 text-gray-400 hover:text-green-400 text-sm transition-colors"
                            >
                                <FaSmile /> React
                            </button>

                            <button
                                onClick={() => setShowReportModal(comment._id)}
                                className=flex items-center gap-1 px-2py-1 text-gray-40hover:text-red-400 text-sm transition-colors"
                            >
                                <FaFlag /> Report
                            </button>
                        </div>
                    </div>

                [object Object]/* Reaction Picker */}
                    <AnimatePresence>
                        {showReactions === comment._id && (
                            <motion.div
                                initial={{ opacity:0                   animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity:0                   className="flex gap-2 bg-gray-700 rounded-lg p-3 mb-3"
                            >
                                {Object.entries(reactionTypes).map(([emoji, type]) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            handleReaction(comment._id, type);
                                            setShowReactions(null);
                                        }}
                                        className="text-2xl hover:scale-125 transition-transform"
                                        title={type}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Replies */}
                  [object Object]comment.replies && comment.replies.length > 0 && (
                        <div className=space-y-3 mt-4                   {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="bg-gray-90ded-2l p-6 shadow-xl">
            <div className=flex items-center justify-between mb-6>
                <h3 className=text-xl font-bold text-blue-300">Comments & Reviews</h3>
                
          [object Object]/* Sort and Filter Controls */}
                <div className=flex items-center gap-3">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-gray-700 text-white rounded px-3 py-1 text-sm focus:ring-2ocus:ring-blue-400focus:outline-none"
                    >
                        <option value="newest>Newest</option>                   <option value="oldest>Oldest</option>                   <option value="popular">Most Popular</option>
                    </select>
                    
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                        className="bg-gray-700 text-white rounded px-3 py-1 text-sm focus:ring-2ocus:ring-blue-400focus:outline-none"
                    >
                        <option value=all">All Comments</option>
                        <option value=top">Top Comments</option>
                        <option value="recent>Recent</option>                   </select>
                </div>
            </div>

            {/* Comment Form */}
            <div className="mb-6>
                <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4py-3 rounded-lg bg-gray-800 text-white focus:ring-2ocus:ring-blue-400focus:outline-none mb-3"
                    placeholder={replyTo ? `Replying to comment...` : "Write your comment or review... (Use @username to mention, **bold**, *italic*, or include links)"}
                    aria-label=Write a comment"
                />
                
                {replyTo && (
                    <div className=mb-3bg-blue-900border border-blue-50unded text-sm text-blue-300">
                        Replying to a comment
                        <button
                            onClick={() => setReplyTo(null)}
                            className="ml-2 text-blue-400over:text-blue-300"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <div className=flex items-center justify-between">
                    <div className=text-xs text-gray-400">
                        Supports: @mentions, **bold**, *italic*, links
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={loading || !newComment.trim()}
                        className=px-6py-2 rounded-lg bg-blue-600 hover:bg-blue-50xt-white font-bold shadow focus:ring-2ocus:ring-blue-400focus:outline-none transition disabled:opacity-50"
                        aria-label="Post comment"
                    >
                      [object Object]loading ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>

                {error && (
                    <div className="text-red-400animate-pulse font-semibold mt-2" role=status" aria-live="polite">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="text-green-400animate-pulse font-semibold mt-2" role=status" aria-live="polite">
                        {success}
                    </div>
                )}
            </div>

            {/* Comments List */}
            <div className="space-y-4>
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className=text-4xl mb-2">💬</div>
                        <div className="text-lg font-semibold mb-2>No comments yet</div>
                        <div className="text-sm">Be the first to share your thoughts!</div>
                    </div>
                ) : (
                    comments.map(comment => renderComment(comment))
                )}
            </div>

            {/* Report Modal */}
            <AnimatePresence>
              [object Object]showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0lack/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReportModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="bg-gray-800rounded-lg p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className=text-lg font-bold mb-4>Report Comment</h3>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Please describe why youre reporting this comment..."
                                className="w-full px-3-2ounded bg-gray-700 text-white focus:ring-2ocus:ring-blue-400focus:outline-none mb-4"
                                rows={4}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleReport(showReportModal)}
                                    disabled={loading || !reportReason.trim()}
                                    className="flex-1 px-42 bg-red-600er:bg-red-500 text-white rounded font-semibold disabled:opacity-50"
                                >
                                    {loading ? Reporting...' : 'Report'}
                                </button>
                                <button
                                    onClick={() => setShowReportModal(null)}
                                    className="flex-1 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 