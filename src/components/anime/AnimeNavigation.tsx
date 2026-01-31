'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Upload, LayoutDashboard, User, LogOut, LogIn, Settings, BookOpen, MessageCircle, ChevronLeft, Moon, Sun, Shield, Bell } from 'lucide-react';
import { FaCoffee, FaHeart, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';
import { useTheme } from '@/components/AdvancedThemeSystem';
import { useAppMode } from '@/contexts/AppModeContext';
import RazorpayPayment from '@/components/RazorpayPayment';

/**
 * Anime Navigation Component
 * Shared navigation bar for all anime pages
 * Matches manga navigation structure exactly
 */
export default function AnimeNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCoffeeModal, setShowCoffeeModal] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, isCreator, user, logout } = useAuth();
    const [hasUploadedAnime, setHasUploadedAnime] = useState(false);
    const { theme, setTheme } = useTheme();
    const { switchToManga } = useAppMode();

    // Check if user is admin - check both role property and isAdmin property
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

    // Debug logging (remove in production)
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('[AnimeNavigation] User data:', {
                role: user.role,
                isAdmin: user.isAdmin,
                isAdminCheck: isAdmin,
                userObject: user
            });
        }
    }, [user, isAuthenticated, isAdmin]);

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
        ...(isAuthenticated && !isCreator ? [{ href: '/upload/intro?mode=anime&returnTo=/anime/creator/upload', label: 'BECOME CREATOR', icon: Upload }] : []),
    ];

    // Creator navigation items (shown when user is already a creator) - anime-specific routes
    // Only show dashboard if user has uploaded anime (like manga mode)
    // Admins can also be creators, so show creator items if they're a creator (even if admin)
    const creatorNavItems = isCreator ? [
        // Only show dashboard if user has uploaded anime
        ...(hasUploadedAnime ? [{ href: '/anime/creator/dashboard', label: 'CREATOR DASHBOARD', icon: LayoutDashboard }] : []),
    ] : [];

    // Admin navigation items (shown when user is admin) - separate from creator dashboard
    // Always show for admin users, regardless of creator status
    const adminNavItems = (isAdmin && isAuthenticated) ? [
        { href: '/admin/dashboard', label: 'ADMIN DASHBOARD', icon: Shield },
    ] : [];

    // Genres list for sidebar
    const genres = [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
        'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
        'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];

    return (
        <div>
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
                        {/* Sidebar - full width on mobile so no strip; clean layout */}
                        <motion.div
                            ref={sidebarRef}
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-full sm:w-80 max-w-sm bg-black/95 backdrop-blur-xl border-r border-orange-500/20 z-[70] overflow-y-auto max-h-[100dvh] shadow-2xl"
                        >
                            <div className="p-4 pb-8">
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4 sm:mb-6 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="text-base sm:text-lg font-bold">Close menu</span>
                                </button>

                                {/* App Mode Switcher - Mobile */}
                                <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-orange-500/20">
                                    <div className="flex items-center justify-center">
                                        <AppModeSwitcher onSwitch={() => setIsSidebarOpen(false)} />
                                    </div>
                                </div>

                                {/* Read Manga Button - Prominent */}
                                <Link
                                    href="/"
                                    onClick={() => {
                                        setIsSidebarOpen(false);
                                        switchToManga();
                                    }}
                                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-lg mb-4 sm:mb-6 transition-all touch-manipulation min-h-[44px]"
                                >
                                    <BookOpen className="w-5 h-5 text-indigo-400" />
                                    <span className="font-semibold text-white">Read Manga</span>
                                </Link>

                                {/* Community Button */}
                                <Link
                                    href="/anime/browse"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 rounded-lg mb-4 sm:mb-6 transition-all touch-manipulation min-h-[44px]"
                                >
                                    <MessageCircle className="w-5 h-5 text-pink-400" />
                                    <span className="font-semibold">Community</span>
                                </Link>

                                {/* Main Navigation Links - Merged from mobile menu; highlight Become a Creator */}
                                <div className="space-y-2 mb-4 sm:mb-6">
                                    <h3 className="px-4 py-3 text-sm sm:text-base font-black text-orange-400 uppercase tracking-wider mb-3 border-b border-orange-500/30">Navigation</h3>
                                    {navItems.map((item) => {
                                        const active = isActive(item.href);
                                        const isBecomeCreator = item.href?.includes('/upload/intro?mode=anime') || item.label === 'BECOME CREATOR';
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors touch-manipulation min-h-[44px] ${isBecomeCreator
                                                        ? 'bg-gradient-to-r from-orange-500/25 to-red-500/25 border border-orange-400/50 text-white font-bold hover:from-orange-500/35 hover:to-red-500/35'
                                                        : active
                                                            ? 'bg-orange-500/20 text-orange-400 font-bold'
                                                            : 'hover:bg-orange-500/20 text-gray-300'
                                                    }`}
                                            >
                                                {item.icon && <item.icon className="w-4 h-4" />}
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Creator and Admin Nav Items */}
                                {[...creatorNavItems, ...adminNavItems].length > 0 && (
                                    <div className="space-y-2 mb-4 sm:mb-6">
                                        {[...creatorNavItems, ...adminNavItems].map((item) => {
                                            const active = isActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors touch-manipulation min-h-[44px] ${active
                                                            ? 'bg-orange-500/20 text-orange-400 font-bold'
                                                            : 'hover:bg-orange-500/20 text-gray-300'
                                                        }`}
                                                >
                                                    {item.icon && <item.icon className="w-4 h-4" />}
                                                    <span>{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Coffee Button - Only for logged-in users */}
                                {isAuthenticated && (
                                    <div className="mb-4 sm:mb-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setShowCoffeeModal(true);
                                                setIsSidebarOpen(false);
                                            }}
                                            className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg touch-manipulation min-h-[44px]"
                                        >
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 5, -5, 0],
                                                    scale: [1, 1.1, 1]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <FaCoffee />
                                            </motion.div>
                                            <span>COFFEE</span>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <FaHeart className="text-red-200 text-xs" />
                                            </motion.div>
                                        </motion.button>
                                    </div>
                                )}

                                {/* Anime Categories */}
                                <div className="space-y-2 mb-4 sm:mb-6">
                                    <h3 className="px-4 py-3 text-sm sm:text-base font-black text-orange-400 uppercase tracking-wider mb-3 border-b border-orange-500/30">Categories</h3>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        Subbed Anime
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        Dubbed Anime
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        Movies
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        TV Series
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        OVAs
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg bg-pink-500/30 hover:bg-pink-500/40 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        ONAs
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        Specials
                                    </Link>
                                    <Link
                                        href="/anime/browse"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="block px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors touch-manipulation min-h-[44px] flex items-center"
                                    >
                                        Events
                                    </Link>
                                </div>

                                {/* Genre Section */}
                                <div className="mb-6">
                                    <h3 className="px-4 py-3 text-sm sm:text-base font-black text-orange-400 uppercase tracking-wider mb-3 border-b border-orange-500/30">
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
                <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">
                        {/* Left Side: Hamburger + M logo + Become Creator + nav links */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                            {/* Hamburger Menu Button */}
                            <button
                                data-hamburger-button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 sm:p-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 transition-colors border border-orange-500/30 flex-shrink-0 touch-manipulation"
                                aria-label="Toggle sidebar menu"
                            >
                                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                            </button>

                            {/* Manga logo - M button */}
                            <Link
                                href="/"
                                className="flex items-center justify-center group flex-shrink-0"
                                onClick={() => switchToManga()}
                            >
                                <div className="relative">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                        <span className="text-white font-bold text-sm sm:text-base md:text-xl">M</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300"></div>
                                </div>
                            </Link>

                            {/* Mobile: Become Creator - icon-only on xs so right actions fit */}
                            <div className="lg:hidden flex items-center flex-shrink min-w-0">
                                {!isCreator && (
                                    <Link
                                        href="/upload/intro?mode=anime&returnTo=/anime/creator/upload"
                                        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/50 text-white font-semibold text-xs sm:text-sm hover:from-orange-500/30 hover:to-red-500/30 touch-manipulation min-h-[40px] sm:min-h-[44px]"
                                        aria-label="Become Creator"
                                    >
                                        <Upload className="w-4 h-4 text-orange-300 flex-shrink-0" />
                                        <span className="hidden sm:inline truncate max-w-[80px] md:max-w-none">Become Creator</span>
                                    </Link>
                                )}
                                {isCreator && hasUploadedAnime && (
                                    <Link
                                        href="/anime/creator/dashboard"
                                        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/50 text-white font-semibold text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-[44px]"
                                        aria-label="Creator dashboard"
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-orange-300 flex-shrink-0" />
                                        <span className="hidden sm:inline">Creator</span>
                                    </Link>
                                )}
                            </div>

                            {/* Navigation Links - Positioned right after logo with equal spacing */}
                            <div className="hidden lg:flex items-center gap-4 xl:gap-6">
                                {[...navItems, ...creatorNavItems, ...adminNavItems].map((item) => {
                                    const active = isActive(item.href);
                                    const isCreatorButton = item.href?.includes('/upload/intro?mode=anime') || item.href === '/become-creator';
                                    const isDashboardButton = item.href === '/anime/creator/dashboard' || item.href === '/admin/dashboard';
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

                                {/* Coffee Button - Only for logged-in users */}
                                {isAuthenticated && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowCoffeeModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg whitespace-nowrap flex-shrink-0 text-sm"
                                    >
                                        <motion.div
                                            animate={{
                                                rotate: [0, 5, -5, 0],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="flex-shrink-0"
                                        >
                                            <FaCoffee className="text-sm" />
                                        </motion.div>
                                        <span>COFFEE</span>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="flex-shrink-0"
                                        >
                                            <FaHeart className="text-red-200 text-xs" />
                                        </motion.div>
                                    </motion.button>
                                )}
                            </div>

                            {/* Mobile Menu Button - Removed, merged with sidebar hamburger */}
                            {/* App Mode Switcher - Hidden on mobile, shown in sidebar */}
                            <div className="hidden sm:block lg:hidden">
                                <AppModeSwitcher />
                            </div>
                        </div>

                        {/* Right Side Actions - sibling so never clipped; equal gap */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                {/* Search */}
                                <button
                                    type="button"
                                    className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center transition-colors touch-manipulation"
                                    aria-label="Search"
                                >
                                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                                </button>

                                {/* Bell / Notifications */}
                                <Link
                                    href="/notifications"
                                    className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center transition-colors touch-manipulation"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                                </Link>

                                {/* Profile - same size so aligned with equal gap */}
                                <div className="relative flex-shrink-0" ref={profileMenuRef}>
                                    {isAuthenticated ? (
                                        <>
                                            <button
                                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/50 hover:scale-110 active:scale-95 transition-transform border-2 border-orange-400/50 touch-manipulation flex-shrink-0"
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
                                                        className="absolute right-0 mt-2 w-[min(calc(100vw-2rem),14rem)] sm:w-56 max-h-[75vh] overflow-y-auto bg-black/95 backdrop-blur-xl border border-orange-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
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
                                                                    <span className="text-sm">Creator Dashboard</span>
                                                                </Link>
                                                            )}
                                                            {isAdmin && (
                                                                <Link
                                                                    href="/admin/dashboard"
                                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                                    className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                                                >
                                                                    <Shield className="w-4 h-4" />
                                                                    <span className="text-sm">Admin Dashboard</span>
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setTheme(theme === 'dark' ? 'light' : 'dark');
                                                                    setIsProfileMenuOpen(false);
                                                                }}
                                                                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                                            >
                                                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                                                <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                                            </button>
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
                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500/50 via-red-500/50 to-pink-500/50 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-95 transition-transform border-2 border-orange-400/30 hover:border-orange-400/50 touch-manipulation flex-shrink-0"
                                            title="Sign In"
                                        >
                                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
            </nav>

            {/* Buy Me a Coffee Modal */}
            {showCoffeeModal && (
                <BuyMeACoffeeNav onClose={() => setShowCoffeeModal(false)} />
            )}
        </div>
    );
}

// Navigation version - auto-opens modal
function BuyMeACoffeeNav({ onClose }: { onClose: () => void }) {
    const [showModal, setShowModal] = useState(true);
    const [amount, setAmount] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const quickAmounts = [10, 50, 100, 500];

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
    };

    const handleContinue = () => {
        const amountNum = parseFloat(amount);

        if (!amount || isNaN(amountNum) || amountNum < 1) {
            setError('Please enter an amount of at least ₹1');
            return;
        }

        if (amountNum > 100000) {
            setError('Maximum amount is ₹1,00,000');
            return;
        }

        setError('');
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        console.log('🎉 Payment successful! Payment ID:', paymentId);
        console.log('💰 Recording donation of ₹', amount);

        setSuccess('Payment successful! Recording your donation... 🎉');
        setError('');
        setShowPayment(false);

        try {
            const response = await fetch('/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    message: customMessage,
                    paymentId,
                    recipientId: process.env.NEXT_PUBLIC_DONATION_RECIPIENT_ID || undefined
                })
            });

            const data = await response.json();
            console.log('📦 Donation record response:', data);

            if (response.ok) {
                console.log('✅ Donation recorded successfully!');
                setSuccess('Thank you for your generous support! ❤️');
                setAmount('');
                setCustomMessage('');

                setTimeout(() => {
                    setShowModal(false);
                    onClose();
                }, 4000);
            } else {
                console.warn('⚠️ Donation record failed, but payment was successful');
                setSuccess('Payment successful! Thank you for your support! ❤️');
                setTimeout(() => {
                    setShowModal(false);
                    onClose();
                }, 4000);
            }
        } catch (err) {
            console.error('❌ Error recording donation:', err);
            setSuccess('Payment successful! Thank you for your support! ❤️');
            setTimeout(() => {
                setShowModal(false);
                onClose();
            }, 4000);
        }
    };

    const handlePaymentError = (error: string) => {
        setError(error);
        setShowPayment(false);
    };

    const handleClose = () => {
        setShowModal(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-700/50 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-10">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                transition={{ duration: 20, repeat: Infinity }}
                                className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-3xl"
                            />
                            <motion.div
                                animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                                transition={{ duration: 15, repeat: Infinity }}
                                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500 to-red-500 rounded-full blur-3xl"
                            />
                        </div>

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <FaTimes className="text-2xl" />
                        </button>

                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="inline-block text-6xl mb-4"
                                >
                                    ☕
                                </motion.div>
                                <h2 className="text-3xl font-bold mb-2">
                                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                                        Buy Me a Coffee
                                    </span>
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    Support our anime platform! Every rupee helps us grow. 💖
                                </p>
                            </div>

                            {success ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-12"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.8, repeat: 3 }}
                                        className="text-8xl mb-6"
                                    >
                                        🎉
                                    </motion.div>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-green-400 text-2xl font-bold mb-4"
                                    >
                                        {success}
                                    </motion.p>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className="flex items-center justify-center space-x-2 text-amber-400"
                                    >
                                        <FaHeart className="text-3xl" />
                                        <FaCoffee className="text-3xl" />
                                        <FaHeart className="text-3xl" />
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        className="text-gray-400 mt-6 text-sm"
                                    >
                                        Closing in a moment...
                                    </motion.p>
                                </motion.div>
                            ) : showPayment ? (
                                <div className="space-y-6">
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-gray-400">Amount:</span>
                                            <span className="text-2xl font-bold text-amber-400">₹{amount}</span>
                                        </div>
                                        {customMessage && (
                                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                <p className="text-sm text-gray-400 mb-1">Your message:</p>
                                                <p className="text-white italic">"{customMessage}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <RazorpayPayment
                                        amount={parseFloat(amount) / 83}
                                        description={`Coffee donation - ${customMessage || 'Thank you for your support!'}`}
                                        onSuccess={handlePaymentSuccess}
                                        onError={handlePaymentError}
                                        metadata={{
                                            type: 'donation',
                                            message: customMessage,
                                            amountINR: parseFloat(amount)
                                        }}
                                    />

                                    <button
                                        onClick={() => setShowPayment(false)}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        Back
                                    </button>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-400 mb-3">
                                            Quick Select:
                                        </label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {quickAmounts.map((value) => (
                                                <motion.button
                                                    key={value}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleQuickAmount(value)}
                                                    className={`py-3 rounded-xl font-bold transition-all ${amount === value.toString()
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                                                        : 'bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 border border-slate-700/50'
                                                        }`}
                                                >
                                                    ₹{value}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-400 mb-3">
                                            Or Enter Your Amount (₹1 - ₹1,00,000):
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-amber-400">
                                                ₹
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white text-lg focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/70 transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Minimum: ₹1 • Maximum: ₹1,00,000
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-400 mb-3">
                                            Leave a Message (Optional):
                                        </label>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="Say something nice... (optional)"
                                            maxLength={200}
                                            rows={3}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/70 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            {customMessage.length}/200
                                        </p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleContinue}
                                        disabled={!amount}
                                        className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                                    >
                                        <FaHeart />
                                        <span>Continue to Payment</span>
                                    </motion.button>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-center">
                                        <p className="text-gray-400 text-sm">
                                            🔒 Secure payment powered by <span className="text-purple-400 font-semibold">Razorpay</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

