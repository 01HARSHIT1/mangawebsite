"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGift, FaComments, FaUsers } from 'react-icons/fa';
import MangaTabs from '@/components/MangaTabs';
import OptimizedImage from './OptimizedImage';
import LiveChat from './LiveChat';
import LiveReactions from './LiveReactions';
import { useWebSocket } from '@/contexts/WebSocketContext';
import RazorpayPayment from './RazorpayPayment';
import MangaFeedbackButtons from './MangaFeedbackButtons';
import PreviouslyOnRecap from './PreviouslyOnRecap';
import { useAIFeatures } from '@/hooks/useAIFeatures';

export default function MangaDetailClient({ manga, chapters, ratings, favorites, author, lastUpdate, status, type, genres, tags }: any) {
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showTip, setShowTip] = useState(false);
    const [showTipPayment, setShowTipPayment] = useState(false);
    const [tipAmount, setTipAmount] = useState('250');
    const [tipMessage, setTipMessage] = useState('');
    const [tipSuccess, setTipSuccess] = useState('');
    const [tipError, setTipError] = useState('');
    const [showLiveChat, setShowLiveChat] = useState(false);
    
    const { currentReaders, joinMangaRoom, leaveMangaRoom } = useWebSocket();

    useEffect(() => {
        // Join manga room for real-time features
        if (manga?._id) {
            joinMangaRoom(manga._id);
        }

        // Check if this manga is bookmarked
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            console.log('ℹ️ No token found, user not logged in');
            setLoading(false);
            return;
        }
        
        fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.bookmarks) {
                    // Check if manga is bookmarked (handle both string and object formats)
                    const isBookmarked = data.user.bookmarks.some((b: any) => 
                        (typeof b === 'string' && b === manga._id) ||
                        (typeof b === 'object' && b.mangaId === manga._id)
                    );
                    setBookmarked(isBookmarked);
                    console.log('🔖 Bookmark status loaded:', isBookmarked);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to load bookmark status:', error);
                setLoading(false);
            });
            
        // Record reading history
        fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'recordReading', mangaId: manga._id })
        });

        // Cleanup: Leave manga room when component unmounts
        return () => {
            if (manga?._id) {
                leaveMangaRoom(manga._id);
            }
        };
    }, [manga._id, joinMangaRoom, leaveMangaRoom]);

    const handleBookmark = async () => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            alert('Please login to bookmark manga');
            return;
        }
        
        setLoading(true);
        try {
            console.log('🔖 Toggling bookmark for manga:', manga._id);
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: bookmarked ? 'removeBookmark' : 'addBookmark', mangaId: manga._id })
            });
            
            if (response.ok) {
                setBookmarked(b => !b);
                console.log('✅ Bookmark toggled successfully:', !bookmarked);
                
                // Show feedback to user
                const message = bookmarked ? 'Removed from bookmarks!' : 'Added to bookmarks!';
                // You could add a toast notification here
                alert(message);
            } else {
                const error = await response.json();
                console.error('❌ Failed to toggle bookmark:', error);
                alert('Failed to bookmark manga. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error toggling bookmark:', error);
            alert('Error bookmarking manga. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const creatorId =
        manga?.uploaderId ||
        manga?.creatorId ||
        manga?.creator?._id ||
        null;

    const TIP_MIN_AMOUNT = 10;
    const TIP_MAX_AMOUNT = 100000;
    const USD_TO_INR_RATE = 83;
    const quickTipAmounts = [100, 250, 500, 1000];

    const resetTipState = () => {
        setTipError('');
        setTipSuccess('');
        setShowTipPayment(false);
        setTipAmount('250');
    };

    const handleTipContinue = () => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            setTipError('You must be logged in to tip the creator.');
            return;
        }

        const amountValue = Number(tipAmount);
        if (Number.isNaN(amountValue)) {
            setTipError('Please enter a valid amount.');
            return;
        }
        if (amountValue < TIP_MIN_AMOUNT) {
            setTipError(`Minimum tip amount is ₹${TIP_MIN_AMOUNT}.`);
            return;
        }
        if (amountValue > TIP_MAX_AMOUNT) {
            setTipError(`Maximum tip amount is ₹${TIP_MAX_AMOUNT.toLocaleString()}.`);
            return;
        }
        if (!creatorId) {
            setTipError('This series is not linked to a creator payout account yet.');
            return;
        }

        setTipError('');
        setShowTipPayment(true);
    };

    const handleTipPaymentSuccess = async (paymentId: string) => {
        const amountValue = Number(tipAmount);
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        setShowTipPayment(false);
        setTipError('');
        setTipSuccess('Payment received! Recording your tip…');

        if (!token) {
            setTipSuccess('Payment received! Please log in again so we can record it under your account.');
            return;
        }

        try {
            const response = await fetch('/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amountValue,
                    message: tipMessage,
                    paymentId,
                    recipientId: creatorId,
                    type: 'creator-tip',
                    mangaId: manga?._id,
                    mangaTitle: manga?.title,
                    metadata: {
                        source: 'creator-tip',
                        mangaTitle: manga?.title,
                        creatorId,
                        mangaId: manga?._id
                    }
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.warn('Tip recorded payment but failed to log donation:', responseData);
                setTipSuccess('Payment successful! We will reconcile your tip shortly.');
            } else {
                const statusMessage = responseData.payoutStatus
                    ? responseData.payoutStatus === 'failed'
                        ? 'Tip recorded! Creator payout will be retried shortly.'
                        : `Tip recorded! Payout status: ${responseData.payoutStatus}.`
                    : 'Thank you for tipping the creator! 🎉';
                const fullMessage = responseData.payoutMessage
                    ? `${statusMessage} ${responseData.payoutMessage}`
                    : statusMessage;
                setTipSuccess(fullMessage);
            }
        } catch (error) {
            console.error('Failed to record tip donation:', error);
            setTipSuccess('Payment successful! We will sync it to the creator in a moment.');
        } finally {
            setTimeout(() => {
                setShowTip(false);
                setTipSuccess('');
                setTipMessage('');
                setTipAmount('250');
            }, 4000);
        }
    };

    const handleTipPaymentError = (message: string) => {
        setShowTipPayment(false);
        setTipError(message || 'Payment was cancelled. Please try again.');
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
                                onClick={() => {
                                    resetTipState();
                                    setTipMessage('');
                                    setShowTip(true);
                                }}
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

                        {/* AI Feedback Buttons */}
                        <MangaFeedbackButtons mangaId={manga._id} />

                        {/* Previously On Recap */}
                        <div className="mt-4">
                            <PreviouslyOnRecap mangaId={manga._id} enabled={true} />
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

            {/* Live Features */}
            <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-4 z-40">
                {/* Current Readers Indicator */}
                {currentReaders[manga._id] && currentReaders[manga._id].length > 0 && (
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-purple-500/20 shadow-lg">
                        <div className="flex items-center space-x-2 text-white">
                            <FaUsers className="text-purple-400" />
                            <span className="text-sm">
                                {currentReaders[manga._id].length} reader{currentReaders[manga._id].length !== 1 ? 's' : ''} online
                            </span>
                        </div>
                    </div>
                )}

                {/* Live Chat Toggle */}
                <button
                    onClick={() => setShowLiveChat(!showLiveChat)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                    title="Toggle Live Chat"
                >
                    <FaComments className="text-xl" />
                </button>

                {/* Live Reactions */}
                <LiveReactions 
                    targetId={manga._id} 
                    targetType="manga"
                    className="relative"
                />
            </div>

            {/* Live Chat */}
            {showLiveChat && (
                <LiveChat
                    mangaId={manga._id}
                    isMinimized={false}
                    onToggleMinimize={() => setShowLiveChat(false)}
                />
            )}

            {/* Tip Modal */}
            {showTip && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
                    onClick={() => {
                        setShowTip(false);
                        resetTipState();
                        setTipMessage('');
                    }}
                >
                    <div
                        className="bg-gray-800 rounded-xl p-8 min-w-80 max-w-md shadow-2xl relative w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setShowTip(false);
                                resetTipState();
                                setTipMessage('');
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
                            aria-label="Close"
                        >
                            &times;
                        </button>

                        <h3 className="text-2xl font-bold text-pink-400 mb-4">Tip the Creator</h3>

                        {tipSuccess ? (
                            <div className="text-green-400 mb-3 text-center font-semibold" role="status">
                                {tipSuccess}
                            </div>
                        ) : showTipPayment ? (
                            <div className="space-y-4">
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Amount</span>
                                        <span className="text-xl font-bold text-pink-300">₹{Number(tipAmount).toLocaleString()}</span>
                                    </div>
                                    {tipMessage && (
                                        <div className="mt-3 text-sm text-gray-400 italic">
                                            “{tipMessage}”
                                        </div>
                                    )}
                                </div>

                                <RazorpayPayment
                                    amount={Number(tipAmount) / USD_TO_INR_RATE}
                                    description={`Tip for ${manga?.title || 'your favorite creator'}`}
                                    onSuccess={handleTipPaymentSuccess}
                                    onError={handleTipPaymentError}
                                    metadata={{
                                        type: 'creator-tip',
                                        creatorId,
                                        mangaId: manga?._id,
                                        mangaTitle: manga?.title,
                                        amountINR: Number(tipAmount)
                                    }}
                                />

                                <button
                                    onClick={() => setShowTipPayment(false)}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Back
                                </button>

                                {tipError && (
                                    <div className="text-red-400 text-sm" role="status">
                                        {tipError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-semibold mb-2 text-sm text-gray-300">
                                        Choose an amount
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {quickTipAmounts.map((amount) => (
                                            <button
                                                key={amount}
                                                onClick={() => {
                                                    setTipAmount(amount.toString());
                                                    setTipError('');
                                                }}
                                                className={`py-3 rounded-lg font-semibold transition-all ${
                                                    Number(tipAmount) === amount
                                                        ? 'bg-pink-500 text-white shadow-lg'
                                                        : 'bg-gray-900 border border-gray-700 text-gray-300 hover:border-pink-400 hover:text-white'
                                                }`}
                                            >
                                                ₹{amount.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="tip-amount" className="font-semibold mb-2 block text-sm text-gray-300">
                                        Custom amount (₹{TIP_MIN_AMOUNT} - ₹{TIP_MAX_AMOUNT.toLocaleString()})
                                    </label>
                                    <input
                                        id="tip-amount"
                                        type="number"
                                        min={TIP_MIN_AMOUNT}
                                        max={TIP_MAX_AMOUNT}
                                        value={tipAmount}
                                        onChange={(e) => {
                                            setTipAmount(e.target.value);
                                            setTipError('');
                                        }}
                                        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white text-base"
                                        aria-label="Tip amount"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold mb-2 block text-sm text-gray-300">
                                        Message to the creator (optional)
                                    </label>
                                    <textarea
                                        value={tipMessage}
                                        onChange={(e) => setTipMessage(e.target.value)}
                                        rows={3}
                                        maxLength={200}
                                        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white text-base resize-none"
                                        placeholder="Let them know why you loved their work!"
                                    />
                                    <div className="text-xs text-gray-500 text-right">
                                        {tipMessage.length}/200
                                    </div>
                                </div>

                                {tipError && <div className="text-red-400" role="status">{tipError}</div>}

                                <button
                                    onClick={handleTipContinue}
                                    className="w-full bg-pink-500 hover:bg-pink-600 text-white border-none rounded-lg py-3 font-bold text-lg transition-colors"
                                    aria-label="Continue to payment"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 