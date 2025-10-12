"use client";
import React, { useState, useEffect } from "react";

function timeAgo(date: Date) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count > 1) return `${count} ${interval.label}s ago`;
        if (count === 1) return `1 ${interval.label} ago`;
    }
    return 'just now';
}

export default function ChapterComments({ chapterId }: { chapterId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch(`/api/chapters/${chapterId}/comments`)
            .then(res => res.json())
            .then(data => setComments(Array.isArray(data) ? data : []));
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setUser(data.user || null));
        }
    }, [chapterId]);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        setError('');
        setSuccess('');
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to comment.');
            setLoading(false);
            return;
        }
        const res = await fetch(`/api/chapters/${chapterId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: newComment }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
            setError(data.error || 'Failed to post comment');
        } else {
            setSuccess('Comment posted!');
            setComments(c => [data.comment, ...c]);
            setNewComment('');
            setTimeout(() => setSuccess(''), 1200);
        }
    };

    return (
        <div className="bg-gray-900 rounded-2xl p-6 shadow-xl mt-10">
            <h3 className="text-xl font-bold mb-4 text-blue-300">Chapter Comments</h3>
            <div className="mb-6">
                <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
                    placeholder="Write your comment..."
                    aria-label="Write a comment"
                />
                <button
                    onClick={handlePost}
                    disabled={loading || !newComment.trim()}
                    className="mt-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    aria-label="Post comment"
                >{loading ? 'Posting...' : 'Post'}</button>
                {error && <div className="text-red-400 animate-pulse font-semibold" role="status" aria-live="polite">{error}</div>}
                {success && <div className="text-green-400 animate-pulse font-semibold" role="status" aria-live="polite">{success}</div>}
            </div>
            <div className="space-y-6">
                {comments.length === 0 && <div className="text-gray-400">No comments yet. Be the first to comment!</div>}
                {comments.map((c, i) => (
                    <div key={c._id || i} className="bg-gray-800 rounded-lg p-4 shadow flex gap-4 items-start transition-all duration-300 animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-lg font-bold text-blue-300">
                            {c.user?.avatarUrl ? (
                                <img src={c.user.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                c.user?.nickname?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-blue-200">{c.user?.nickname || 'User'}</span>
                                <span className="text-xs text-gray-400">{c.createdAt ? timeAgo(new Date(c.createdAt)) : ''}</span>
                            </div>
                            <div className="text-gray-200 mb-2 whitespace-pre-line">{c.text}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 