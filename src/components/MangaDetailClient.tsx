"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGift } from 'react-icons/fa';
import MangaTabs from '@/components/MangaTabs';
import OptimizedImage from './OptimizedImage';

export default function MangaDetailClient({ manga, chapters, ratings, favorites, author, lastUpdate, status, type, genres, tags }: any) {
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showTip, setShowTip] = useState(false);
    const [tipAmount, setTipAmount] = useState(100);
    const [tipLoading, setTipLoading] = useState(false);
    const [tipSuccess, setTipSuccess] = useState('');
    const [tipError, setTipError] = useState('');

    useEffect(() => {
        // Check if this manga is bookmarked
        const token = localStorage.getItem('token');
        if (!token) return setLoading(false);
        fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.bookmarks && data.user.bookmarks.includes(manga._id)) {
                    setBookmarked(true);
                }
                setLoading(false);
            });
        // Record reading history
        fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'recordReading', mangaId: manga._id })
        });
    }, [manga._id]);

    const handleBookmark = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: bookmarked ? 'removeBookmark' : 'addBookmark', mangaId: manga._id })
        });
        setBookmarked(b => !b);
        setLoading(false);
    };

    const handleTip = async () => {
        setTipLoading(true);
        setTipError('');
        setTipSuccess('');
        const token = localStorage.getItem('token');
        if (!token) {
            setTipError('You must be logged in.');
            setTipLoading(false);
            return;
        }
        const res = await fetch(`/api/manga/${manga._id}/tip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ amount: tipAmount })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setTipSuccess('Thank you for supporting the creator!');
            setTimeout(() => { setShowTip(false); setTipSuccess(''); }, 1500);
        } else {
            setTipError(data.error || 'Failed to send tip');
        }
        setTipLoading(false);
    };

    return (
        <div style={{ background: '#181A20', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, Arial, sans-serif' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 24px 24px' }}>
                {/* Left: Cover and actions */}
                <div style={{ minWidth: 260, maxWidth: 260 }}>
                    <div style={{ background: '#222', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                        {manga.coverImage ? (
                            <img src={manga.coverImage} alt={manga.title} width={260} height={360} style={{ objectFit: 'cover', width: '100%', height: '100%' }} onError={e => { e.currentTarget.src = '/file.svg'; }} />
                        ) : (
                            <img src="/file.svg" alt={manga.title} width={260} height={360} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                    </div>
                    <Link href={`/manga/${manga._id}/chapter/${chapters && chapters[0]?._id ? chapters[0]._id : '1'}`}>
                        <button style={{ width: '100%', background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Read Chapter 1</button>
                    </Link>
                    <button
                        onClick={handleBookmark}
                        disabled={loading}
                        style={{ width: '100%', background: bookmarked ? '#f59e42' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 700, fontSize: 17 }}>
                        {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    </button>
                    <button
                        onClick={() => setShowTip(true)}
                        style={{ width: '100%', background: '#f472b6', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 700, fontSize: 17, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        aria-label="Tip the Creator"
                    >
                        <FaGift /> Tip the Creator
                    </button>
                    {showTip && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#23272F', borderRadius: 16, padding: 32, minWidth: 320, maxWidth: 360, boxShadow: '0 2px 16px #0008', position: 'relative' }}>
                                <button onClick={() => setShowTip(false)} style={{ position: 'absolute', top: 12, right: 16, color: '#aaa', background: 'none', border: 'none', fontSize: 28, fontWeight: 700, cursor: 'pointer' }} aria-label="Close">&times;</button>
                                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f472b6', marginBottom: 16 }}>Tip the Creator</h3>
                                <div style={{ marginBottom: 16 }}>
                                    <label htmlFor="tip-amount" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Amount (Coins)</label>
                                    <input
                                        id="tip-amount"
                                        type="number"
                                        min={10}
                                        step={10}
                                        value={tipAmount}
                                        onChange={e => setTipAmount(Number(e.target.value))}
                                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #444', background: '#181A20', color: '#fff', fontSize: 16 }}
                                        aria-label="Tip amount"
                                    />
                                </div>
                                {tipError && <div style={{ color: '#f87171', marginBottom: 10 }} role="status">{tipError}</div>}
                                {tipSuccess && <div style={{ color: '#a3e635', marginBottom: 10 }} role="status">{tipSuccess}</div>}
                                <button
                                    onClick={handleTip}
                                    disabled={tipLoading || tipAmount < 10}
                                    style={{ width: '100%', background: '#f472b6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8, opacity: tipLoading ? 0.7 : 1 }}
                                    aria-label="Confirm tip"
                                >{tipLoading ? 'Sending...' : `Send ${tipAmount} Coins`}</button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginTop: 18, alignItems: 'center' }}>
                        <span style={{ color: '#facc15', fontWeight: 700, fontSize: 16 }}>★ {ratings}</span>
                        <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 16 }}>♥ {favorites.toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 24, fontSize: 15, color: '#fff', background: '#23272F', borderRadius: 12, padding: 18, lineHeight: 2 }}>
                        <div><b>Status:</b> <span style={{ color: '#a3e635', fontWeight: 600 }}>{status}</span></div>
                        <div><b>Type:</b> <span style={{ color: '#f472b6', fontWeight: 600 }}>{type}</span></div>
                        <div><b>Author:</b> {author}</div>
                        <div><b>Chapters:</b> {chapters.length}</div>
                        <div><b>Last update:</b> {lastUpdate}</div>
                    </div>
                </div>
                {/* Right: Details */}
                <MangaTabs manga={manga} chapters={chapters} mangaId={manga._id} />
            </div>
        </div>
    );
} 