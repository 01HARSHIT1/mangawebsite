"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import OptimizedImage from './OptimizedImage';

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

function ReviewComments({ mangaId }: { mangaId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        // Fetch comments for this manga
        fetch(`/api/comments?mangaId=${mangaId}`)
            .then(res => res.json())
            .then(data => setComments(Array.isArray(data) ? data : []))
            .catch(err => console.error('Failed to load comments:', err));
        
        // Fetch user info - check both token storage keys
        setLoadingUser(true);
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        console.log('🔍 Checking for auth token...');
        console.log('  authToken:', localStorage.getItem('authToken') ? 'Found' : 'Not found');
        console.log('  token:', localStorage.getItem('token') ? 'Found' : 'Not found');
        console.log('  Using token:', token ? 'Yes' : 'No');
        
        if (token) {
            console.log('📡 Fetching user profile with token...');
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    console.log('📥 Profile response status:', res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('📦 Profile data received:', data);
                    if (data.user) {
                        setUser(data.user);
                        console.log('✅ User loaded for reviews:', data.user.username);
                    } else {
                        console.warn('⚠️ No user in response:', data);
                    }
                    setLoadingUser(false);
                })
                .catch(err => {
                    console.error('❌ Failed to load user:', err);
                    setError('Failed to verify login. Please refresh the page.');
                    setLoadingUser(false);
                });
        } else {
            console.warn('⚠️ No authentication token found');
            setLoadingUser(false);
        }
    }, [mangaId]);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        setError('');
        setSuccess('');
        
        // Check both token storage keys
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to comment.');
            setLoading(false);
            return;
        }

        try {
            console.log('📤 Posting comment to manga:', mangaId);
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ mangaId, text: newComment }),
            });
            
            console.log('📥 Response status:', res.status);
            const data = await res.json();
            console.log('📦 Response data:', data);
            
            setLoading(false);
            
            if (!res.ok) {
                setError(data.error || 'Failed to post comment');
                console.error('❌ Failed to post comment:', data);
            } else {
                setSuccess('Comment posted!');
                setComments(c => [data.comment, ...c]);
                setNewComment('');
                console.log('✅ Comment posted successfully');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('❌ Error posting comment:', err);
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-blue-300">Reviews & Comments</h3>
            
            {/* Existing Comments List - Show First */}
            <div className="space-y-4 mb-6">
                {comments.length === 0 && <div className="text-gray-400 text-center py-6">No comments yet. Be the first to review!</div>}
                {comments.map((c, i) => (
                    <div key={c._id || i} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                {c.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-white">{c.user?.username || 'Anonymous'}</div>
                                <div className="text-sm text-gray-400">{c.createdAt ? timeAgo(new Date(c.createdAt)) : ''}</div>
                            </div>
                        </div>
                        <div className="text-gray-200">{c.text}</div>
                    </div>
                ))}
            </div>

            {/* Comment Input - Show After Comments */}
            {loadingUser ? (
                <div className="bg-gray-700 rounded-lg p-6 text-center border-t-2 border-blue-600">
                    <p className="text-gray-400">Loading...</p>
                </div>
            ) : user ? (
                <div className="border-t-2 border-blue-600 pt-6">
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
                        placeholder="Write your review or comment..."
                        aria-label="Write a review or comment"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Commenting as <span className="text-blue-400 font-semibold">{user.username}</span></span>
                        <button
                            onClick={handlePost}
                            disabled={loading || !newComment.trim()}
                            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold shadow focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                            aria-label="Post comment"
                        >{loading ? 'Posting...' : 'Post'}</button>
                    </div>
                    {error && <div className="text-red-400 font-semibold mt-2" role="status" aria-live="polite">{error}</div>}
                    {success && <div className="text-green-400 font-semibold mt-2" role="status" aria-live="polite">{success}</div>}
                </div>
            ) : (
                <div className="bg-gray-700 rounded-lg p-6 text-center border-t-2 border-blue-600">
                    <p className="text-gray-400 mb-3">Please login to comment</p>
                    <a href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                        Login
                    </a>
                </div>
            )}
        </div>
    );
}

export default function MangaTabs({ manga, chapters, mangaId }: { manga: any; chapters: any[]; mangaId: string }) {
    const [tab, setTab] = useState<'synopsis' | 'chapters' | 'reviews'>('synopsis');
    const [search, setSearch] = useState('');
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [likeCount, setLikeCount] = useState(manga.likes?.length || 0);
    const [viewCount, setViewCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [latestChapterNumber, setLatestChapterNumber] = useState<number>(0);

    const feedbackRef = useRef<HTMLSpanElement>(null);

    // Get genres and tags from manga
    const genres = useMemo(() => {
        if (manga.genre) {
            return Array.isArray(manga.genre) ? manga.genre : manga.genre.split(',').map((g: string) => g.trim());
        }
        return [];
    }, [manga.genre]);

    const tags = useMemo(() => {
        if (manga.tags) {
            return Array.isArray(manga.tags) ? manga.tags : [];
        }
        return [];
    }, [manga.tags]);

    // Filter chapters based on search
    const filteredChapters = useMemo(() => {
        if (!search.trim()) return chapters;
        const searchLower = search.toLowerCase();
        return chapters.filter(ch =>
            ch.chapterNumber?.toString().includes(searchLower) ||
            ch.title?.toLowerCase().includes(searchLower) ||
            ch.subtitle?.toLowerCase().includes(searchLower)
        );
    }, [chapters, search]);

    useEffect(() => {
        // Get user info
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserId(data.user._id);
                        setLiked(data.user.likes?.includes(mangaId) || false);
                        setBookmarked(data.user.bookmarks?.includes(mangaId) || false);
                    }
                });
        }

        // Get latest chapter number
        if (chapters.length > 0) {
            const numbers = chapters.map(ch => ch.chapterNumber).filter(n => typeof n === 'number');
            if (numbers.length > 0) {
                setLatestChapterNumber(Math.max(...numbers));
            }
        }

        // Get view count from analytics
        fetch(`/api/manga/${mangaId}/analytics`)
            .then(res => res.json())
            .then(data => {
                if (data && data.seriesEngagement) {
                    const found = data.seriesEngagement.find((s: any) => s._id === mangaId);
                    setViewCount(found ? found.views : 0);
                } else {
                    // Fallback to manga's view count
                    setViewCount(manga.views || 0);
                }
            })
            .catch(error => {
                // Handle any network errors gracefully
                console.log('Analytics fetch failed, using manga view count:', error.message);
                setViewCount(manga.views || 0);
            });
    }, [mangaId, manga.likes]);

    const handleBookmark = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: bookmarked ? 'removeBookmark' : 'addBookmark', mangaId })
        });
        setBookmarked(b => !b);
        setFeedback(bookmarked ? 'Bookmark removed!' : 'Bookmarked!');
        if (feedbackRef.current) feedbackRef.current.focus();
        setTimeout(() => setFeedback(''), 1200);
        setLoading(false);
    };

    const handleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        const res = await fetch(`/api/manga/${mangaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: liked ? 'unlike' : 'like', userId })
        });
        if (res.ok) {
            setLiked(l => !l);
            setLikeCount((c: number) => liked ? c - 1 : c + 1);
            setFeedback(liked ? 'Like removed!' : 'Liked!');
            if (feedbackRef.current) feedbackRef.current.focus();
            setTimeout(() => setFeedback(''), 1200);
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-extrabold text-white">{manga.title}</h1>
                <div className="flex items-center gap-3">
                    {viewCount !== null && (
                        <span className="text-gray-400 text-sm" aria-label="View count">
                            👁️ {viewCount} views
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-6 mb-6 border-b border-gray-700">
                <button
                    data-tab="synopsis"
                    onClick={() => setTab('synopsis')}
                    className={`pb-2 px-1 font-semibold text-lg transition-colors ${tab === 'synopsis'
                        ? 'text-white border-b-2 border-red-500'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Synopsis
                </button>
                <button
                    data-tab="chapters"
                    onClick={() => setTab('chapters')}
                    className={`pb-2 px-1 font-semibold text-lg transition-colors ${tab === 'chapters'
                        ? 'text-white border-b-2 border-red-500'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Chapters ({chapters.length})
                </button>
                <button
                    data-tab="reviews"
                    onClick={() => setTab('reviews')}
                    className={`pb-2 px-1 font-semibold text-lg transition-colors ${tab === 'reviews'
                        ? 'text-white border-b-2 border-red-500'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Reviews
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
                {tab === 'synopsis' && (
                    <>
                        <div className="bg-gray-800 rounded-xl p-6 mb-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Summary</h3>
                            <div className="text-gray-300 leading-relaxed">
                                {manga.description || 'No description available.'}
                            </div>
                        </div>
                        <div className="flex gap-3 flex-wrap mb-6">
                            {genres.map((g: string, i: number) => (
                                <span
                                    key={`genre-${g}-${i}`}
                                    className="bg-gray-700 text-white rounded-lg px-4 py-2 font-semibold text-sm"
                                >
                                    {g}
                                </span>
                            ))}
                            {Array.isArray(tags) && tags.map((t: string, i: number) => (
                                <span
                                    key={`tag-${t}-${i}`}
                                    className="bg-gray-700 text-white rounded-lg px-4 py-2 font-semibold text-sm"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {tab === 'chapters' && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white">Chapters</h3>
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search by chapter number or title..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full max-w-md px-4 py-3 rounded-lg border-none bg-gray-800 text-white text-base shadow-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredChapters.map((ch) => (
                                <div
                                    key={ch._id}
                                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors cursor-pointer group"
                                    onClick={() => { window.location.href = `/manga/${mangaId}/chapter/${ch._id}`; }}
                                    title={ch.subtitle || `Chapter ${ch.chapterNumber}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                                            {ch.coverPage ? (
                                                <img
                                                    src={ch.coverPage}
                                                    alt={`Cover for chapter ${ch.chapterNumber}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">CH {ch.chapterNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-lg text-white">
                                                Chapter {ch.chapterNumber}
                                            </div>
                                            {ch.subtitle && (
                                                <div className="text-gray-400 text-sm truncate">
                                                    {ch.subtitle}
                                                </div>
                                            )}
                                            <div className="text-gray-500 text-xs mt-1">
                                                {ch.createdAt ? timeAgo(new Date(ch.createdAt)) : ''}
                                            </div>
                                        </div>
                                        {ch.chapterNumber === latestChapterNumber && (
                                            <span className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs font-bold">
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredChapters.length === 0 && (
                            <div className="text-gray-400 text-lg text-center py-12">
                                No chapters found.
                            </div>
                        )}
                    </div>
                )}

                {tab === 'reviews' && (
                    <ReviewComments mangaId={mangaId} />
                )}
            </div>
        </div>
    );
} 