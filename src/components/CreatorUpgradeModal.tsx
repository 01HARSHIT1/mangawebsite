'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreatorUpgradeModal({ isOpen, onClose, onSuccess }: CreatorUpgradeModalProps) {
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [twitter, setTwitter] = useState('');
    const [instagram, setInstagram] = useState('');
    const [website, setWebsite] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!displayName.trim()) {
            setError('Display name is required');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/upgrade-creator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    displayName: displayName.trim(),
                    bio: bio.trim() || undefined,
                    avatar: avatar.trim() || undefined,
                    socialLinks: {
                        twitter: twitter.trim() || undefined,
                        instagram: instagram.trim() || undefined,
                        website: website.trim() || undefined,
                    },
                }),
            });

            if (response.ok) {
                onSuccess?.();
                onClose();
                // Refresh the page to update user state
                window.location.reload();
            } else {
                const data = await response.json();
                setError(data.error || 'Upgrade failed');
            }
        } catch (err) {
            setError('Upgrade failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-xl">✨</span>
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Become a Creator
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl transition-colors duration-300"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                        <h3 className="font-semibold text-purple-300 mb-3 flex items-center">
                            <span className="mr-2">🎯</span>
                            Creator Benefits:
                        </h3>
                        <ul className="text-sm text-gray-300 space-y-2">
                            <li className="flex items-center">
                                <span className="mr-2">📚</span>
                                Upload and manage your manga
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2">📊</span>
                                Access to creator dashboard
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2">📈</span>
                                Track your manga performance
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2">👤</span>
                                Build your creator profile
                            </li>
                        </ul>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center">
                                <span className="mr-2">⚠️</span>
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-300">
                                Creator Display Name *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                    placeholder="How you want to be known as a creator"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <span className="text-gray-400">👤</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="bio" className="block text-sm font-semibold text-gray-300">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                                placeholder="Tell us about yourself and your work..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="avatar" className="block text-sm font-semibold text-gray-300">
                                Avatar URL
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    id="avatar"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                    placeholder="https://example.com/your-avatar.jpg"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <span className="text-gray-400">🖼️</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6">
                            <h4 className="font-semibold text-gray-300 mb-4 flex items-center">
                                <span className="mr-2">🔗</span>
                                Social Links (Optional)
                            </h4>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="twitter" className="block text-sm font-semibold text-gray-300">
                                        Twitter
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            id="twitter"
                                            value={twitter}
                                            onChange={(e) => setTwitter(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://twitter.com/yourusername"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">🐦</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="instagram" className="block text-sm font-semibold text-gray-300">
                                        Instagram
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            id="instagram"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://instagram.com/yourusername"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">📷</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="website" className="block text-sm font-semibold text-gray-300">
                                        Website
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            id="website"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://yourwebsite.com"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-gray-400">🌐</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-700/50 text-gray-300 py-3 px-6 rounded-xl hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <span className="relative z-10">
                                    {isLoading ? '🔄 Upgrading...' : '✨ Become Creator'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
