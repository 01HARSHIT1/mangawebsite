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
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Cover and actions */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="bg-gray-800 rounded-xl overflow-hidden mb-6 shadow-lg">
                            {manga.coverImage ? (
                                <img
                                    src={manga.coverImage}
                                    alt={manga.title}
                                    className="w-full h-96 object-cover"
                                    onError={e => { e.currentTarget.src = '/file.svg'; }}
                                />
                            ) : (
                                <img
                                    src="/file.svg"
                                    alt={manga.title}
                                    className="w-full h-96 object-cover bg-gray-700"
                                />
                            )}
                        </div>

                        <div className="space-y-3">
                            <Link href={`/manga/${manga._id}/chapter/${chapters && chapters[0]?._id ? chapters[0]._id : '1'}`}>
                                <button className="w-full bg-red-600 hover:bg-red-700 text-white border-none rounded-lg py-4 font-bold text-lg transition-colors">
                                    {chapters && chapters[0] ? `Read Chapter ${chapters[0].chapterNumber}` : 'No Chapters Available'}
                                </button>
                            </Link>

                            <button
                                onClick={handleBookmark}
                                disabled={loading}
                                className={`w-full border-none rounded-lg py-4 font-bold text-lg transition-colors ${bookmarked
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                            </button>

                            <button
                                onClick={() => setShowTip(true)}
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white border-none rounded-lg py-4 font-bold text-lg mt-3 flex items-center justify-center gap-2 transition-colors"
                                aria-label="Tip the Creator"
                            >
                                <FaGift /> Tip the Creator
                            </button>
                        </div>

                        <div className="flex gap-4 mt-6 items-center">
                            <span className="text-yellow-400 font-bold text-lg">★ {ratings}</span>
                            <span className="text-blue-400 font-bold text-lg">♥ {favorites.toLocaleString()}</span>
                        </div>

                        <div className="mt-6 text-sm text-white bg-gray-800 rounded-xl p-5 space-y-2">
                            <div><span className="font-semibold">Status:</span> <span className="text-green-400 font-medium">{status}</span></div>
                            <div><span className="font-semibold">Type:</span> <span className="text-pink-400 font-medium">{type}</span></div>
                            <div><span className="font-semibold">Author:</span> {author}</div>
                            <div><span className="font-semibold">Chapters:</span> {chapters?.length || 0}</div>
                            <div><span className="font-semibold">Last update:</span> {lastUpdate}</div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1">
                        <MangaTabs manga={manga} chapters={chapters} mangaId={manga._id} />
                    </div>
                </div>
            </div>

            {/* Tip Modal */}
            {showTip && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl p-8 min-w-80 max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowTip(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
                            aria-label="Close"
                        >
                            &times;
                        </button>

                        <h3 className="text-2xl font-bold text-pink-400 mb-4">Tip the Creator</h3>

                        <div className="mb-4">
                            <label htmlFor="tip-amount" className="font-semibold mb-2 block">Amount (Coins)</label>
                            <input
                                id="tip-amount"
                                type="number"
                                min={10}
                                step={10}
                                value={tipAmount}
                                onChange={e => setTipAmount(Number(e.target.value))}
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white text-base"
                                aria-label="Tip amount"
                            />
                        </div>

                        {tipError && <div className="text-red-400 mb-3" role="status">{tipError}</div>}
                        {tipSuccess && <div className="text-green-400 mb-3" role="status">{tipSuccess}</div>}

                        <button
                            onClick={handleTip}
                            disabled={tipLoading || tipAmount < 10}
                            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white border-none rounded-lg py-3 font-bold text-lg transition-colors"
                            aria-label="Confirm tip"
                        >
                            {tipLoading ? 'Sending...' : `Send ${tipAmount} Coins`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 