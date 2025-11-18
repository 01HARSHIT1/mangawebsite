'use client';

import { useState, useEffect } from 'react';
import { FaThumbsUp, FaThumbsDown, FaTimes, FaHeart } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface MangaFeedbackButtonsProps {
    mangaId: string;
    onFeedbackChange?: (feedbackType: string | null) => void;
}

export default function MangaFeedbackButtons({ mangaId, onFeedbackChange }: MangaFeedbackButtonsProps) {
    const { isAuthenticated } = useAuth();
    const [currentFeedback, setCurrentFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userFeedback, setUserFeedback] = useState<{
        liked: any[];
        disliked: any[];
        discontinued: any[];
        notInterested: any[];
    } | null>(null);

    useEffect(() => {
        if (isAuthenticated && mangaId) {
            loadUserFeedback();
        }
    }, [isAuthenticated, mangaId]);

    const loadUserFeedback = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/user/manga-feedback', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUserFeedback(data);

                // Check current feedback for this manga
                if (data.liked?.some((f: any) => (typeof f === 'string' ? f : f.mangaId) === mangaId)) {
                    setCurrentFeedback('like');
                } else if (data.disliked?.some((f: any) => (typeof f === 'string' ? f : f.mangaId) === mangaId)) {
                    setCurrentFeedback('dislike');
                } else if (data.discontinued?.some((f: any) => (typeof f === 'string' ? f : f.mangaId) === mangaId)) {
                    setCurrentFeedback('discontinued');
                } else if (data.notInterested?.some((f: any) => (typeof f === 'string' ? f : f.mangaId) === mangaId)) {
                    setCurrentFeedback('not-interested');
                } else {
                    setCurrentFeedback(null);
                }
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        }
    };

    const handleFeedback = async (feedbackType: string) => {
        if (!isAuthenticated) {
            alert('Please login to provide feedback');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            // If clicking the same feedback, remove it
            const newFeedback = currentFeedback === feedbackType ? null : feedbackType;

            if (newFeedback) {
                const response = await fetch('/api/user/manga-feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        mangaId,
                        feedbackType: newFeedback
                    })
                });

                if (response.ok) {
                    setCurrentFeedback(newFeedback);
                    onFeedbackChange?.(newFeedback);
                    loadUserFeedback(); // Reload to sync
                }
            } else {
                // Remove feedback by sending opposite action
                const response = await fetch('/api/user/manga-feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        mangaId,
                        feedbackType: 'like' // This will remove the current feedback
                    })
                });

                if (response.ok) {
                    setCurrentFeedback(null);
                    onFeedbackChange?.(null);
                    loadUserFeedback();
                }
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-400 mr-2">Help us improve:</span>
            
            <button
                onClick={() => handleFeedback('like')}
                disabled={loading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentFeedback === 'like'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="I like this manga"
            >
                <FaThumbsUp />
                <span>Like</span>
            </button>

            <button
                onClick={() => handleFeedback('dislike')}
                disabled={loading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentFeedback === 'dislike'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="I don't like this manga"
            >
                <FaThumbsDown />
                <span>Dislike</span>
            </button>

            <button
                onClick={() => handleFeedback('discontinued')}
                disabled={loading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentFeedback === 'discontinued'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="I stopped reading this"
            >
                <FaTimes />
                <span>Stopped</span>
            </button>

            <button
                onClick={() => handleFeedback('not-interested')}
                disabled={loading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentFeedback === 'not-interested'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Not interested"
            >
                <FaHeart className="rotate-45" />
                <span>Not Interested</span>
            </button>
        </div>
    );
}

