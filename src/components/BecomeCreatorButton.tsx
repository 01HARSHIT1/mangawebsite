'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaRocket, FaSpinner } from 'react-icons/fa';

export default function BecomeCreatorButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleUpgradeToCreator = async () => {
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/user/upgrade-creator', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Update local storage with new user data
                localStorage.setItem('authToken', token || '');

                // Show success message
                alert('🎉 Congratulations! You are now a creator!');

                // Redirect to creator panel
                router.push('/creator-panel');

                // Reload to update auth context
                window.location.href = '/creator-panel';
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to upgrade to creator');
            }
        } catch (err) {
            console.error('Creator upgrade error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show if already a creator
    if (user?.isCreator || user?.role === 'creator') {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
            >
                <FaRocket className="mr-2" />
                Become a Creator
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Become a Creator
                        </h2>

                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                As a creator, you'll be able to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                                <li>Upload your own manga</li>
                                <li>Manage your content</li>
                                <li>View detailed analytics</li>
                                <li>Interact with your audience</li>
                                <li>Earn from your creations</li>
                            </ul>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpgradeToCreator}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Upgrading...
                                    </>
                                ) : (
                                    <>
                                        <FaRocket className="mr-2" />
                                        Upgrade Now
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
