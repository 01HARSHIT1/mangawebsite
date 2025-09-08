'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, isAuthenticated, isCreator } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setIsLoading(false);
    }, [isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
                    <p className="text-gray-600 mb-4">Unable to load your profile.</p>
                    <Link href="/login" className="text-blue-600 hover:text-blue-800">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600">
                                {user.creatorProfile?.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="text-white">
                            <h1 className="text-3xl font-bold">
                                {user.creatorProfile?.displayName || user.username}
                            </h1>
                            <p className="text-blue-100 mt-1">{user.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                                {isCreator && (
                                    <span className="inline-block px-3 py-1 text-sm font-medium bg-white bg-opacity-20 text-white rounded-full">
                                        Creator
                                    </span>
                                )}
                                <span className="text-blue-100 text-sm">
                                    Member since {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Information */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {user.username}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {user.email}
                                    </p>
                                </div>

                                {isCreator && user.creatorProfile && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Creator Display Name
                                            </label>
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.creatorProfile.displayName}
                                            </p>
                                        </div>

                                        {user.creatorProfile.bio && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Bio
                                                </label>
                                                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                    {user.creatorProfile.bio}
                                                </p>
                                            </div>
                                        )}

                                        {user.creatorProfile.socialLinks && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Social Links
                                                </label>
                                                <div className="space-y-2">
                                                    {user.creatorProfile.socialLinks.twitter && (
                                                        <a
                                                            href={user.creatorProfile.socialLinks.twitter}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block text-blue-600 hover:text-blue-800 bg-gray-50 px-3 py-2 rounded-md"
                                                        >
                                                            Twitter: {user.creatorProfile.socialLinks.twitter}
                                                        </a>
                                                    )}
                                                    {user.creatorProfile.socialLinks.instagram && (
                                                        <a
                                                            href={user.creatorProfile.socialLinks.instagram}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block text-blue-600 hover:text-blue-800 bg-gray-50 px-3 py-2 rounded-md"
                                                        >
                                                            Instagram: {user.creatorProfile.socialLinks.instagram}
                                                        </a>
                                                    )}
                                                    {user.creatorProfile.socialLinks.website && (
                                                        <a
                                                            href={user.creatorProfile.socialLinks.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block text-blue-600 hover:text-blue-800 bg-gray-50 px-3 py-2 rounded-md"
                                                        >
                                                            Website: {user.creatorProfile.socialLinks.website}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>

                            <div className="space-y-4">
                                <Link
                                    href="/upload"
                                    className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Upload Manga
                                </Link>

                                {isCreator && (
                                    <Link
                                        href="/creator/dashboard"
                                        className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Creator Dashboard
                                    </Link>
                                )}

                                <Link
                                    href="/profile/edit"
                                    className="block w-full bg-gray-600 text-white text-center py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Edit Profile
                                </Link>
                            </div>

                            {/* Account Stats */}
                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Type:</span>
                                        <span className="font-medium">
                                            {isCreator ? 'Creator' : 'User'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Member Since:</span>
                                        <span className="font-medium">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Last Updated:</span>
                                        <span className="font-medium">
                                            {new Date(user.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}