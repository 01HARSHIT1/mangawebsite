'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Menu, X, Upload, LayoutDashboard, User, LogOut, LogIn, Settings, BookOpen, MessageCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';

/**
 * Anime Navigation Component
 * Shared navigation bar for all anime pages
 * Matches manga navigation structure exactly
 */
export default function AnimeNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, isCreator, user, logout } = useAuth();
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

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                // Don't close if clicking the hamburger button
                const target = event.target as HTMLElement;
                if (!target.closest('[data-hamburger-button]')) {
                    setIsSidebarOpen(false);
                }
            }
        };
        if (isProfileMenuOpen || isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen, isSidebarOpen]);

    const handleLogout = () => {
        logout();
        setIsProfileMenuOpen(false);
        router.push('/anime');
    };

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
        <>
            {/* Hamburger Menu Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/70 z-[60]"
                        />
                        {/* Sidebar */}
                        <motion.div
                            ref={sidebarRef}
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-black/95 backdrop-blur-xl border-r border-orange-500/20 z-[70] overflow-y-auto"
                        >
                            <div className="p-4">
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="font-semibold">Close menu</span>
                                </button>

                                {/* Community Button */}
                                <Link
                                    href="/anime/browse"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 rounded-lg mb-6 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5 text-pink-400" />
                                    <span className="font-semibold">Community</span>
                                </Link>

                                {/* Navigation Links */}
                                <div className="space-y-2 mb-8">
                                    <Link
                                        href="/anime"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Subbed Anime
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Dubbed Anime
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Movies
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        TV Series
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        OVAs
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg bg-pink-500/30 hover:bg-pink-500/40 transition-colors"
                                    >
                                        ONAs
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Specials
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                                    >
                                        Events
                                    </Link>
                                </div>

                                {/* Genre Section */}
                                <div className="mb-6">
                                    <h3 className="px-4 py-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                                        Genre
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {genres.slice(0, 18).map((genre) => (
                                            <Link
                                                key={genre}
                                                href={`/anime/genres?genre=${genre.toLowerCase().replace(/\s+/g, '-')}`}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className="px-3 py-2 text-sm rounded-lg hover:bg-orange-500/20 transition-colors text-center"
                                            >
                                                {genre}
                                            </Link>
                                        ))}
                                    </div>
                                    <Link
                                        href="/anime/genres"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 mt-3 text-sm text-orange-400 hover:text-orange-300 font-semibold text-center"
                                    >
                                        + More
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Side: Hamburger Menu Button + Logo */}
                        <div className="flex items-center space-x-3">
                            {/* Hamburger Menu Button */}
                            <button
                                data-hamburger-button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/30"
                                aria-label="Toggle sidebar menu"
                            >
                                <Menu className="w-6 h-6 text-orange-400" />
                            </button>
                            
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
                        
                        {/* Profile/Account Dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/50 hover:scale-110 transition-transform border-2 border-orange-400/50"
                                    >
                                        {user?.creatorProfile?.displayName?.charAt(0)?.toUpperCase() || 
                                         user?.username?.charAt(0)?.toUpperCase() || 
                                         user?.email?.charAt(0)?.toUpperCase() || 
                                         'U'}
                                    </button>
                                    <AnimatePresence>
                                        {isProfileMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-orange-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
                                            >
                                                <div className="p-4 border-b border-orange-500/20">
                                                    <p className="text-white font-semibold text-sm truncate">
                                                        {user?.creatorProfile?.displayName || user?.username || 'User'}
                                                    </p>
                                                    <p className="text-gray-400 text-xs truncate">
                                                        {user?.email}
                                                    </p>
                                                </div>
                                                <div className="py-2">
                                                    <Link
                                                        href="/anime/library"
                                                        onClick={() => setIsProfileMenuOpen(false)}
                                                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                                    >
                                                        <BookOpen className="w-4 h-4" />
                                                        <span className="text-sm">My Library</span>
                                                    </Link>
                                                    {isCreator && hasUploadedAnime && (
                                                        <Link
                                                            href="/anime/creator/dashboard"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                            className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                                        >
                                                            <LayoutDashboard className="w-4 h-4" />
                                                            <span className="text-sm">Dashboard</span>
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/settings"
                                                        onClick={() => setIsProfileMenuOpen(false)}
                                                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span className="text-sm">Settings</span>
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span className="text-sm">Sign Out</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/50 via-red-500/50 to-pink-500/50 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform border-2 border-orange-400/30 hover:border-orange-400/50"
                                    title="Sign In"
                                >
                                    <User className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                        
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

