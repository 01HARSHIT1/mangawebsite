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

    useEffect(() => {
        // Fetch comments for this manga
        fetch(`/api/comments?mangaId=${mangaId}`)
            .then(res => res.json())
            .then(data => setComments(Array.isArray(data) ? data : []));
        // Fetch user info
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setUser(data.user || null));
        }
    }, [mangaId]);

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
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ mangaId, text: newComment }),
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
        <div className="bg-gray-900 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-blue-300">Reviews & Comments</h3>
            <div className="mb-6">
                <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
                    placeholder="Write your review or comment..."
                    aria-label="Write a review or comment"
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
                {comments.length === 0 && <div className="text-gray-400">No comments yet. Be the first to review!</div>}
                {comments.map((c, i) => (
                    <div key={c._id || i} className="bg-gray-800 rounded-lg p-4 shadow flex gap-4 items-start transition-all duration-300 animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-lg font-bold text-blue-300">
                            {c.user?.avatarUrl ? (
                                <OptimizedImage src={c.user.avatarUrl} alt="avatar" width={40} height={40} className="w-full h-full object-cover rounded-full" fallbackSrc="/file.svg" />
                            ) : (
                                <OptimizedImage src="/file.svg" alt="avatar" width={40} height={40} className="w-full h-full object-cover rounded-full" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-blue-200">{c.user?.nickname || 'User'}</span>
                                <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                            </div>
                            <div className="text-gray-200 mb-2 whitespace-pre-line">{c.text}</div>
                            {/* Reactions, edit/delete, and replies can be added here */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MangaTabs({ manga, chapters, mangaId }: { manga: any, chapters: any[], mangaId: string }) {
    const [tab, setTab] = useState<'synopsis' | 'chapters' | 'reviews'>('synopsis');
    const [search, setSearch] = useState('');
    const genres = manga.genre ? manga.genre.split(',').map((g: string) => g.trim()) : [];
    const tags = manga.tags || [];

    // Sort chapters by chapterNumber descending
    const sortedChapters = useMemo(() =>
        [...chapters].sort((a, b) => Number(b.chapterNumber) - Number(a.chapterNumber)),
        [chapters]
    );

    // Filter chapters by search
    const filteredChapters = useMemo(() =>
        sortedChapters.filter(ch =>
        (!search ||
            (ch.chapterNumber && ch.chapterNumber.toString().includes(search)) ||
            (ch.subtitle && ch.subtitle.toLowerCase().includes(search.toLowerCase()))
        )
        ),
        [sortedChapters, search]
    );

    // Find the latest chapter (for 'New' badge)
    const latestChapterNumber = sortedChapters.length > 0 ? sortedChapters[0].chapterNumber : null;

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(manga.likes ? manga.likes.length : 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [viewCount, setViewCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (res.ok) {
                        return res.json();
                    } else {
                        // If profile API fails (401, 403, etc.), handle gracefully
                        console.log('Profile API not available, user not authenticated');
                        return null;
                    }
                })
                .then(data => {
                    if (data && data.user) {
                        setUserId(data.user._id || null);
                        setBookmarked(data.user.bookmarks && Array.isArray(data.user.bookmarks) && data.user.bookmarks.includes(mangaId));
                        setLiked(manga.likes && Array.isArray(manga.likes) && data.user && manga.likes.includes(data.user._id));
                    } else {
                        // User not authenticated, set defaults
                        setUserId(null);
                        setBookmarked(false);
                        setLiked(false);
                    }
                })
                .catch(error => {
                    // Handle any network errors gracefully
                    console.log('Profile fetch failed:', error.message);
                    setUserId(null);
                    setBookmarked(false);
                    setLiked(false);
                });
        }
        // Fetch view count (aggregate from analytics or placeholder)
        fetch(`/api/creator-analytics?mangaId=${mangaId}`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    // If analytics API fails (401, 403, etc.), use manga's view count as fallback
                    console.log('Analytics API not available, using manga view count');
                    return null;
                }
            })
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

    const feedbackRef = useRef<HTMLSpanElement>(null);

    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h1 style={{ fontSize: 36, fontWeight: 800 }}>{manga.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={handleLike}
                        disabled={loading}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105"
                        aria-label={liked ? 'Unlike' : 'Like'}
                        tabIndex={0}
                        title={liked ? 'Unlike this manga' : 'Like this manga'}
                        onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !loading) handleLike(); }}
                    >
                        {liked ? <FaHeart style={{ animation: feedback === 'Liked!' ? 'pulse 0.4s' : undefined }} /> : <FaRegHeart />}
                        {likeCount}
                    </button>
                    <button
                        onClick={handleBookmark}
                        disabled={loading}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105"
                        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        tabIndex={0}
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark this manga'}
                        onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !loading) handleBookmark(); }}
                    >
                        {bookmarked ? <FaBookmark style={{ animation: feedback === 'Bookmarked!' ? 'pulse 0.4s' : undefined }} /> : <FaRegBookmark />}
                        {bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    {viewCount !== null && <span style={{ color: '#aaa', fontSize: 16, marginLeft: 8, transition: 'opacity 0.3s', opacity: viewCount !== null ? 1 : 0 }} aria-label="View count"><span className="sr-only">Total views: </span>👁️ {viewCount} views</span>}
                    <span ref={feedbackRef} tabIndex={-1} style={{ color: '#facc15', fontWeight: 600, marginLeft: 8, outline: 'none' }} role="status" aria-live="polite">{feedback}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
                <div
                    style={{ fontWeight: 600, fontSize: 18, color: tab === 'synopsis' ? '#fff' : '#aaa', borderBottom: tab === 'synopsis' ? '2px solid #e11d48' : '2px solid transparent', paddingBottom: 4, cursor: 'pointer' }}
                    onClick={() => setTab('synopsis')}
                    role="tab"
                    aria-selected={tab === 'synopsis'}
                >Synopsis</div>
                <div
                    style={{ fontWeight: 600, fontSize: 18, color: tab === 'chapters' ? '#fff' : '#aaa', borderBottom: tab === 'chapters' ? '2px solid #e11d48' : '2px solid transparent', paddingBottom: 4, cursor: 'pointer' }}
                    onClick={() => setTab('chapters')}
                    role="tab"
                    aria-selected={tab === 'chapters'}
                >Chapters ({chapters.length})</div>
                <div
                    style={{ fontWeight: 600, fontSize: 18, color: tab === 'reviews' ? '#fff' : '#aaa', borderBottom: tab === 'reviews' ? '2px solid #e11d48' : '2px solid transparent', paddingBottom: 4, cursor: 'pointer' }}
                    onClick={() => setTab('reviews')}
                    role="tab"
                    aria-selected={tab === 'reviews'}
                >Reviews</div>
            </div>
            {/* Tabs content */}
            <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
                {tab === 'synopsis' && (
                    <>
                        <div style={{ background: '#23272F', borderRadius: 12, padding: 20, marginBottom: 18, fontSize: 17, color: '#e5e5e5' }}>
                            <b>Summary</b>
                            <div style={{ marginTop: 8 }}>{manga.description}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                            {genres.map((g: string, i: number) => (
                                <span key={g ? g + '-' + i : 'genre-' + i} style={{ background: '#23272F', color: '#fff', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>{g}</span>
                            ))}
                            {Array.isArray(tags) && tags.map((t: string, i: number) => (
                                <span key={t ? t + '-' + i : 'tag-' + i} style={{ background: '#23272F', color: '#fff', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>{t}</span>
                            ))}
                        </div>
                    </>
                )}
                {tab === 'chapters' && (
                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Chapters</div>
                        <div style={{ marginBottom: 18 }}>
                            <input
                                type="text"
                                placeholder="Search by chapter number or title..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: 340, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#23272F', color: '#fff', fontSize: 16, boxShadow: '0 2px 8px #0004' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                            {filteredChapters.map((ch) => (
                                <div
                                    key={ch._id}
                                    style={{ background: '#23272F', borderRadius: 16, padding: 16, width: 270, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8, boxShadow: '0 2px 8px #0002', position: 'relative', cursor: 'pointer' }}
                                    onClick={() => { if (ch.pdfFile) window.open(ch.pdfFile, '_blank'); }}
                                    title={ch.subtitle || ch.chapterNumber}
                                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105"
                                >
                                    <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', background: '#333', flexShrink: 0 }}>
                                        {ch.coverPage ? (
                                            <img src={ch.coverPage} alt={`Cover for chapter ${ch.chapterNumber}`} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div style={{ width: 70, height: 70, background: '#444' }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 18 }}>Chapter {ch.chapterNumber}</div>
                                        <div style={{ color: '#aaa', fontSize: 15 }}>{ch.subtitle || ''}</div>
                                        <div style={{ color: '#aaa', fontSize: 14, marginTop: 2 }}>{ch.createdAt ? timeAgo(new Date(ch.createdAt)) : ''}</div>
                                    </div>
                                    {ch.chapterNumber === latestChapterNumber && (
                                        <span style={{ position: 'absolute', top: 10, right: 16, background: '#e11d48', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>New</span>
                                    )}
                                </div>
                            ))}
                            {filteredChapters.length === 0 && (
                                <div style={{ color: '#aaa', fontSize: 18, marginTop: 24 }}>No chapters found.</div>
                            )}
                        </div>
                    </div>
                )}
                {tab === 'reviews' && (
                    <ReviewComments mangaId={mangaId} />
                )}
            </div>
        </div>
    );
} 