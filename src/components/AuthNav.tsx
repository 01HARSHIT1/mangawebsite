'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthNav() {
    const { user, isAuthenticated, isCreator, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center space-x-3">
                <Link
                    href="/login"
                    className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-blue-500/20"
                >
                    <span className="relative z-10">🔑 Login</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                    href="/signup"
                    className="group relative px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    <span className="relative z-10">🚀 Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="group flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-purple-500/20"
            >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                    <span className="text-white text-sm font-bold">
                        {user?.creatorProfile?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                </div>
                <span className="hidden md:block font-medium">
                    {user?.creatorProfile?.displayName || user?.username}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl py-2 z-50 border border-purple-500/20 backdrop-blur-md">
                    <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white">
                            {user?.creatorProfile?.displayName || user?.username}
                        </p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        {isCreator && (
                            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                ✨ Creator
                            </span>
                        )}
                    </div>

                    <Link
                        href="/profile"
                        className="group flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all duration-300"
                        onClick={() => setShowUserMenu(false)}
                    >
                        <span className="mr-3">👤</span>
                        Profile
                    </Link>

                    {isCreator && (
                        <Link
                            href="/creator/dashboard"
                            className="group flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-pink-500/20 transition-all duration-300"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <span className="mr-3">📊</span>
                            Creator Dashboard
                        </Link>
                    )}

                    <Link
                        href="/upload"
                        className="group flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-amber-500/20 transition-all duration-300"
                        onClick={() => setShowUserMenu(false)}
                    >
                        <span className="mr-3">📤</span>
                        Upload Manga
                    </Link>

                    <div className="border-t border-gray-700 mt-2">
                        <button
                            onClick={handleLogout}
                            className="group flex items-center w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300"
                        >
                            <span className="mr-3">🚪</span>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
