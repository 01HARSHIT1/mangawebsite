'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Search, Menu, X, Upload, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';

/**
 * Anime Navigation Component
 * Shared navigation bar for all anime pages
 * Matches manga navigation structure exactly
 */
export default function AnimeNavigation() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated, isCreator } = useAuth();
    const [hasUploadedAnime, setHasUploadedAnime] = useState(false);

    // Check if user has uploaded anime (only for creators)
    useEffect(() => {
        if (isCreator && isAuthenticated) {
            const checkAnimeUpload = async () => {
                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const response = await fetch('/api/anime/creator/dashboard', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setHasUploadedAnime(data.stats?.totalAnime > 0 || data.series?.length > 0);
                    }
                } catch (error) {
                    // Silently fail - user might not have uploaded yet
                    setHasUploadedAnime(false);
                }
            };
            checkAnimeUpload();
        }
    }, [isCreator, isAuthenticated]);

    // Check if current path matches
    const isActive = (path: string) => {
        if (path === '/anime') {
            return pathname === '/anime' || pathname === '/anime/';
        }
        return pathname?.startsWith(path);
    };

    const navItems = [
        { href: '/anime', label: 'HOME' },
        { href: '/anime/browse', label: 'BROWSE' },
        { href: '/anime/genres', label: 'GENRES' },
        { href: '/anime/library', label: 'MY LIBRARY' },
        // Show Become a Creator for authenticated non-creators - points to anime-specific upload
        ...(isAuthenticated && !isCreator ? [{ href: '/anime/creator/upload', label: 'BECOME CREATOR', icon: Upload }] : []),
    ];

    // Creator navigation items (shown when user is already a creator) - anime-specific routes
    // Only show dashboard if user has uploaded anime (like manga mode)
    const creatorNavItems = isCreator ? [
        { href: '/anime/creator/upload', label: 'UPLOAD', icon: Upload },
        // Only show dashboard if user has uploaded anime
        ...(hasUploadedAnime ? [{ href: '/anime/creator/dashboard', label: 'DASHBOARD', icon: LayoutDashboard }] : []),
    ] : [];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/anime" className="flex items-center space-x-3 group">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                                <Play className="w-7 h-7 text-white fill-white" />
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-black"
                            />
                        </motion.div>
                        <div className="hidden md:block">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                                ANIMESTREAM
                            </h1>
                            <p className="text-xs text-orange-300/70 -mt-1">Premium Anime Hub</p>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {[...navItems, ...creatorNavItems].map((item) => {
                            const active = isActive(item.href);
                            const isCreatorButton = item.href?.includes('/anime/creator/upload') || item.href === '/become-creator';
                            const isDashboardButton = item.href === '/anime/creator/dashboard';
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        text-sm font-medium transition-colors relative flex items-center gap-2
                                        ${isCreatorButton
                                            ? 'px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold shadow-lg shadow-orange-500/50'
                                            : active
                                            ? 'text-orange-400 font-bold'
                                            : 'text-gray-400 hover:text-orange-400'
                                        }
                                    `}
                                >
                                    {item.icon && <item.icon className="w-4 h-4" />}
                                    {item.label}
                                    {active && !isCreatorButton && !isDashboardButton && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-400"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center space-x-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/30"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-5 h-5 text-orange-400" />
                            ) : (
                                <Menu className="w-5 h-5 text-orange-400" />
                            )}
                        </button>
                        <AppModeSwitcher />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Search Button (Desktop) */}
                        <button className="hidden lg:block p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/30">
                            <Search className="w-5 h-5 text-orange-400" />
                        </button>
                        <AppModeSwitcher />
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-orange-500/20 py-4"
                    >
                        <div className="flex flex-col space-y-3">
                            {[...navItems, ...creatorNavItems].map((item) => {
                                const active = isActive(item.href);
                                const isCreatorButton = item.href?.includes('/anime/creator/upload') || item.href === '/become-creator';
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                                            ${isCreatorButton
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg shadow-orange-500/50'
                                                : active
                                                ? 'bg-orange-500/20 text-orange-400 font-bold'
                                                : 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400'
                                            }
                                        `}
                                    >
                                        {item.icon && <item.icon className="w-4 h-4" />}
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </nav>
    );
}

