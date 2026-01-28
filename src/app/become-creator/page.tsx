'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BecomeCreatorPage() {
    const { user, isAuthenticated, isCreator } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleUpgrade = async () => {
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/upgrade-to-creator', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setMessage('✅ Successfully upgraded to Creator! Refreshing page...');
                // Refresh the page to update auth context
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to upgrade to creator');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700">
                    <h1 className="text-2xl font-bold text-white mb-4">Login Required</h1>
                    <p className="text-gray-300 mb-6">You need to be logged in to become a creator.</p>
                    <Link href="/login" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (isCreator) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700 text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">You're Already a Creator!</h1>
                        <p className="text-gray-300">You have full access to all creator features.</p>
                    </div>
                    <div className="space-y-3">
                        <Link href="/creator/dashboard" className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            Go to Creator Dashboard
                        </Link>
                        <Link href="/creator/analytics" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            View Analytics
                        </Link>
                        <Link href="/upload/intro?mode=manga" className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors">
                            Upload Manga
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-gray-700">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🎨</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Become a Creator</h1>
                    <p className="text-gray-300">Unlock exclusive features and start sharing your manga with the world!</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Creator Benefits:</h2>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Upload unlimited manga and chapters</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Access to professional Creator Dashboard</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Advanced Analytics and Performance Metrics</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Track views, likes, comments, and earnings</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Build your audience and grow your fanbase</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <span>Monetize your content and earn revenue</span>
                        </li>
                    </ul>
                </div>

                {message && (
                    <div className="bg-green-500/20 border border-green-500 text-green-400 rounded-lg p-4 mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-4 mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Upgrading...
                        </span>
                    ) : (
                        '🚀 Upgrade to Creator Status'
                    )}
                </button>

                <p className="text-center text-gray-400 text-sm mt-4">
                    By becoming a creator, you agree to our{' '}
                    <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-purple-400 hover:underline">Creator Guidelines</Link>
                    <br />
                    <span className="text-xs text-gray-500 mt-2 block">
                        Also see: <Link href="/refund" className="text-purple-400 hover:underline">Refund Policy</Link>
                        {' '}| <Link href="/shipping" className="text-purple-400 hover:underline">Shipping Policy</Link>
                        {' '}| <Link href="/contact" className="text-purple-400 hover:underline">Contact Us</Link>
                    </span>
                </p>
            </div>
        </div>
    );
}

