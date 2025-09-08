'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthNav from './AuthNav';

export default function Navigation() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated, isCreator } = useAuth();

    return (
        <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl border-b border-purple-500/20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    {/* Logo and main navigation */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center group">
                            <div className="relative">
                                <span className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-300">
                                    MangaReader
                                </span>
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                            </div>
                        </Link>

                        {/* Desktop navigation */}
                        <div className="hidden md:ml-8 md:flex md:space-x-2">
                            <Link
                                href="/"
                                className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-purple-500/20"
                            >
                                <span className="relative z-10">🏠 Home</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                            <Link
                                href="/manga"
                                className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-blue-500/20"
                            >
                                <span className="relative z-10">📚 Browse Manga</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                            <Link
                                href="/genres"
                                className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-emerald-500/20"
                            >
                                <span className="relative z-10">🏷️ Genres</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    href="/upload"
                                    className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-amber-500/20"
                                >
                                    <span className="relative z-10">📤 Upload</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>
                            )}
                            {isCreator && (
                                <Link
                                    href="/creator/dashboard"
                                    className="group relative px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-pink-500/20"
                                >
                                    <span className="relative z-10">📊 Dashboard</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Auth navigation */}
                    <div className="flex items-center">
                        <AuthNav />

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ml-2"
                        >
                            <svg
                                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg
                                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
                        <Link
                            href="/"
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/manga"
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Browse Manga
                        </Link>
                        <Link
                            href="/genres"
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Genres
                        </Link>
                        {isAuthenticated && (
                            <Link
                                href="/upload"
                                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Upload
                            </Link>
                        )}
                        {isCreator && (
                            <Link
                                href="/creator/dashboard"
                                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}