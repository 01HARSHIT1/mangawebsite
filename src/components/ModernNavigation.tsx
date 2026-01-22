'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/contexts/AppModeContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';
import { FaSearch, FaBell, FaUser, FaBookmark, FaChartBar, FaUpload, FaCog, FaSignOutAlt, FaBars, FaTimes, FaHome, FaBook, FaTags, FaCoins, FaCrown, FaExchangeAlt, FaShieldAlt, FaQuestionCircle, FaHeadset, FaMoon, FaSun, FaCoffee, FaHeart } from 'react-icons/fa';
import { Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RazorpayPayment from './RazorpayPayment';

export default function ModernNavigation() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showCoffeeModal, setShowCoffeeModal] = useState(false);
    const { isAuthenticated, user, logout, isCreator } = useAuth();
    const { appMode, switchToAnime } = useAppMode();
    const router = useRouter();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch unread notifications count
    useEffect(() => {
        if (isAuthenticated) {
            const fetchUnreadCount = async () => {
                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const response = await fetch('/api/notifications?unread=true&limit=1', {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUnreadCount(data.pagination?.total || data.notifications?.length || 0);
                    } else if (response.status === 401) {
                        // Not authenticated, silently fail
                        setUnreadCount(0);
                    }
                } catch (error) {
                    console.error('Failed to fetch unread notifications:', error);
                    setUnreadCount(0);
                }
            };

            fetchUnreadCount();
            // Poll every 60 seconds
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    // Handle search
    useEffect(() => {
        if (searchQuery.length > 2) {
            // Debounced search
            const timer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/manga/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data.manga || []);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        router.push('/');
    };

    const navItems = [
        { href: '/', label: 'Home', icon: FaHome },
        { href: '/manga', label: 'Browse', icon: FaBook },
        { href: '/anime', label: 'Anime', icon: Play }, // Added Anime menu item
        { href: '/genres', label: 'Genres', icon: FaTags },
        // Show Become a Creator for authenticated non-creators in the main nav cluster
        ...(isAuthenticated && !isCreator ? [{ href: '/upload?type=manga', label: 'Become Creator', icon: FaUpload }] : [])
    ];

    const policyItems = [
        { href: '/refund', label: 'Refund Policy', icon: FaCog },
        { href: '/shipping', label: 'Shipping Policy', icon: FaCog },
        { href: '/contact', label: 'Contact Us', icon: FaCog },
    ];

    const userNavItems = isAuthenticated ? [
        { href: '/library', label: 'Library', icon: FaBookmark },
        { href: '/stats', label: 'Statistics', icon: FaChartBar },
        { href: '/coins', label: 'Coins', icon: FaCoins },
    ] : [];

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    // Creator nav items - show for creators (admins can also be creators, so show if creator)
    const creatorNavItems = isCreator ? [
        { href: '/upload', label: 'Upload', icon: FaUpload },
        { href: '/creator/dashboard', label: 'Creator', icon: FaCrown },
    ] : [];

    // Admin nav items - removed from main navigation (accessible via user menu)
    const adminNavItems: any[] = [];

    // Don't show manga navigation in anime mode
    if (appMode === 'anime') {
        return null;
    }

    return (
        <>
            {/* Main Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'glass-strong shadow-xl border-b border-white/10'
                : 'bg-transparent'
                }`}>
                <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-4 md:gap-6">
                        {/* App Mode Switcher - Desktop */}
                        <div className="hidden lg:block mr-2 sm:mr-4">
                            <AppModeSwitcher />
                        </div>

                        {/* Logo - Text Only */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
                                <div className="hidden sm:block min-w-0">
                                    <h1 className="text-base sm:text-lg md:text-xl font-bold text-gradient truncate">MangaReader</h1>
                                    <p className="text-[10px] sm:text-xs text-gray-400 -mt-0.5 sm:-mt-1 truncate hidden md:block">Professional Platform</p>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation - Responsive */}
                        <div className={`hidden lg:flex items-center flex-1 justify-center min-w-0 ${isAuthenticated ? 'gap-2 xl:gap-2.5' : 'gap-2.5 xl:gap-3'}`}>
                            {navItems.map((item) => {
                                // Special styling for Home and Become Creator
                                const isHome = item.href === '/';
                                const isBecomeCreator = item.label === 'Become Creator';
                                const isSpecial = isHome || isBecomeCreator;
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center space-x-1 px-2.5 xl:px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg transition-all duration-200 ${
                                            isSpecial
                                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 text-white font-semibold hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20'
                                                : 'text-gray-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50'
                                        }`}
                                    >
                                        <item.icon className={`text-sm flex-shrink-0 ${isSpecial ? 'text-indigo-300' : ''}`} />
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Link>
                                );
                            })}

                            {userNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center space-x-1 px-2.5 xl:px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all duration-200"
                                >
                                    <item.icon className="text-sm flex-shrink-0" />
                                    <span className="hidden xl:inline">{item.label}</span>
                                </Link>
                            ))}

                            {creatorNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center space-x-1 px-2.5 xl:px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 text-white font-semibold hover:from-yellow-500/30 hover:to-amber-500/30 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-200"
                                >
                                    <item.icon className="text-sm flex-shrink-0 text-yellow-300" />
                                    <span className="hidden xl:inline">{item.label}</span>
                                </Link>
                            ))}

                            {/* Buy Me a Coffee Button - Only for logged-in users */}
                            {isAuthenticated && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCoffeeModal(true)}
                                    className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-2.5 xl:px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-1 shadow-lg whitespace-nowrap flex-shrink-0 text-sm"
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
                                    <span className="hidden xl:inline">Coffee</span>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="flex-shrink-0"
                                    >
                                        <FaHeart className="text-red-200 text-[10px]" />
                                    </motion.div>
                                </motion.button>
                            )}
                        </div>

                        {/* Search & Actions - Responsive */}
                        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 lg:space-x-4 flex-shrink-0">
                            {/* Search - Responsive */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="p-2 sm:p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
                                    aria-label="Search"
                                >
                                    <FaSearch className="text-gray-400 text-sm sm:text-base" />
                                </button>

                                <AnimatePresence>
                                    {isSearchOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-full mt-2 w-[90vw] sm:w-80 max-w-sm search-container"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Search manga, creators, genres..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="input focus-ring text-sm sm:text-base"
                                                autoFocus
                                            />

                                            {searchResults.length > 0 && (
                                                <div className="search-results mt-2">
                                                    {searchResults.map((manga: any) => (
                                                        <Link
                                                            key={manga._id}
                                                            href={`/manga/${manga._id}`}
                                                            className="search-item flex items-center space-x-3"
                                                            onClick={() => {
                                                                setIsSearchOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                        >
                                                            <img
                                                                src={manga.coverImage || '/placeholder.svg'}
                                                                alt={manga.title}
                                                                className="w-12 h-16 object-cover rounded-md"
                                                            />
                                                            <div>
                                                                <h4 className="font-medium text-white">{manga.title}</h4>
                                                                <p className="text-sm text-gray-400">by {manga.creator}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Notifications - Responsive */}
                            {isAuthenticated && (
                                <Link
                                    href="/notifications"
                                    className="relative p-2 sm:p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
                                    onClick={async () => {
                                        // Mark all as read when clicking the bell
                                        if (unreadCount > 0) {
                                            try {
                                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                await fetch('/api/notifications/mark-all-read', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`
                                                    }
                                                });
                                                setUnreadCount(0);
                                            } catch (error) {
                                                console.error('Failed to mark notifications as read:', error);
                                            }
                                        }
                                    }}
                                >
                                    <FaBell className="text-gray-400" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 rounded-full flex items-center justify-center px-1">
                                            <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                        </span>
                                    )}
                                </Link>
                            )}

                            {/* User Menu - Responsive */}
                            {isAuthenticated ? (
                                <div className="relative dropdown">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs sm:text-sm font-semibold">
                                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <span className="hidden lg:block text-xs sm:text-sm font-medium text-white">
                                            {user?.username || 'User'}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute right-0 top-full mt-2 w-[90vw] sm:w-80 max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
                                            >
                                                {/* User Info Header */}
                                                <div className="p-4 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-b border-slate-700">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                                            <span className="text-white text-lg font-bold">
                                                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-white font-semibold text-sm truncate">
                                                                {user?.username || 'User'}
                                                            </h3>
                                                            <p className="text-gray-400 text-xs truncate">
                                                                {user?.email || 'user@example.com'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isCreator && (
                                                        <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-md">
                                                            <FaCrown className="text-yellow-400 text-xs" />
                                                            <span className="text-indigo-300 text-xs font-medium">Creator Account</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-2">
                                                    {/* Main Actions */}
                                                    <Link
                                                        href="/profile"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaUser className="text-indigo-400 w-4" />
                                                        <span className="text-sm font-medium">My Profile</span>
                                                    </Link>

                                                    <Link
                                                        href="/library"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaBookmark className="text-indigo-400 w-4" />
                                                        <span className="text-sm font-medium">My Library</span>
                                                    </Link>

                                                    {/* Admin Dashboard Link */}
                                                    {isAdmin && (
                                                        <Link
                                                            href="/admin/dashboard"
                                                            className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-l-2 border-purple-500"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                        >
                                                            <FaShieldAlt className="text-purple-400 w-4" />
                                                            <span className="text-sm font-medium">Admin Dashboard</span>
                                                        </Link>
                                                    )}

                                                    {/* Creator Dashboard Link */}
                                                    {isCreator && !isAdmin && (
                                                        <>
                                                            <Link
                                                                href="/creator/dashboard"
                                                                className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                                onClick={() => setIsUserMenuOpen(false)}
                                                            >
                                                                <FaCrown className="text-yellow-400 w-4" />
                                                                <span className="text-sm font-medium">Creator Dashboard</span>
                                                            </Link>
                                                            <Link
                                                                href="/creator/dashboard/upload"
                                                                className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                                onClick={() => setIsUserMenuOpen(false)}
                                                            >
                                                                <FaUpload className="text-green-400 w-4" />
                                                                <span className="text-sm font-medium">Upload Content</span>
                                                            </Link>
                                                        </>
                                                    )}

                                                    <Link
                                                        href="/stats"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaChartBar className="text-indigo-400 w-4" />
                                                        <span className="text-sm font-medium">My Statistics</span>
                                                    </Link>

                                                    <Link
                                                        href="/coins"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaCoins className="text-yellow-400 w-4" />
                                                        <span className="text-sm font-medium">My Coins</span>
                                                    </Link>

                                                    <div className="border-t border-slate-700 my-2"></div>

                                                    {/* Account Management */}
                                                    <button
                                                        onClick={async () => {
                                                            await logout();
                                                            setIsUserMenuOpen(false);
                                                            router.push('/login');
                                                        }}
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white w-full text-left"
                                                    >
                                                        <FaExchangeAlt className="text-blue-400 w-4" />
                                                        <span className="text-sm font-medium">Switch Account</span>
                                                    </button>

                                                    <div className="border-t border-slate-700 my-2"></div>

                                                    {/* Settings & Support */}
                                                    <Link
                                                        href="/settings"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaCog className="text-gray-400 w-4" />
                                                        <span className="text-sm font-medium">Settings</span>
                                                    </Link>

                                                    <Link
                                                        href="/help"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaQuestionCircle className="text-gray-400 w-4" />
                                                        <span className="text-sm font-medium">Help Center</span>
                                                    </Link>

                                                    <Link
                                                        href="/contact"
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-gray-300 hover:text-white"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <FaHeadset className="text-gray-400 w-4" />
                                                        <span className="text-sm font-medium">Contact Support</span>
                                                    </Link>

                                                    <div className="border-t border-slate-700 my-2"></div>

                                                    {/* Sign Out */}
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 w-full text-left"
                                                    >
                                                        <FaSignOutAlt className="w-4" />
                                                        <span className="text-sm font-medium">Sign Out</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
                                    <Link 
                                        href="/login" 
                                        className="px-3 sm:px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 text-white text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center"
                                    >
                                        <span className="hidden sm:inline">Sign In</span>
                                        <span className="sm:hidden">Login</span>
                                    </Link>
                                    <Link 
                                        href="/signup" 
                                        className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center"
                                    >
                                        <span className="hidden sm:inline">Sign Up</span>
                                        <span className="sm:hidden">Join</span>
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Button - Responsive */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2.5 sm:p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200 text-white touch-manipulation min-h-[44px] sm:min-h-0"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <FaTimes className="text-base sm:text-lg" /> : <FaBars className="text-base sm:text-lg" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Mobile Menu Panel - Responsive */}
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-0 right-0 h-full w-[85vw] sm:w-80 max-w-sm glass-strong border-l border-white/10 z-50 lg:hidden overflow-y-auto"
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-6 sm:mb-8">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Menu</h2>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2.5 sm:p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 touch-manipulation min-h-[44px] sm:min-h-0"
                                        aria-label="Close menu"
                                    >
                                        <FaTimes className="text-base sm:text-lg" />
                                    </button>
                                </div>

                                {/* App Mode Switcher - Mobile */}
                                <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-700">
                                    <div className="flex items-center justify-center">
                                        <AppModeSwitcher onSwitch={() => setIsMobileMenuOpen(false)} />
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    {/* Navigation Items - Touch-friendly */}
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                // Switch to anime mode if clicking anime link
                                                if (item.href === '/anime' && appMode !== 'anime') {
                                                    switchToAnime();
                                                }
                                            }}
                                        >
                                            <item.icon className="text-indigo-400 text-base sm:text-lg" />
                                            <span className="text-white font-medium text-sm sm:text-base">{item.label}</span>
                                        </Link>
                                    ))}
                                    
                                    {/* User Nav Items */}
                                    {userNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <item.icon className="text-indigo-400 text-base sm:text-lg" />
                                            <span className="text-white font-medium text-sm sm:text-base">{item.label}</span>
                                        </Link>
                                    ))}
                                    
                                    {/* Creator Nav Items */}
                                    {creatorNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <item.icon className="text-indigo-400 text-base sm:text-lg" />
                                            <span className="text-white font-medium text-sm sm:text-base">{item.label}</span>
                                        </Link>
                                    ))}

                                    {/* Policy Pages - Touch-friendly */}
                                    <div className="border-t border-slate-700 my-3 sm:my-4"></div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Legal</h3>
                                    {policyItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <item.icon className="text-slate-400 text-base sm:text-lg" />
                                            <span className="text-slate-300 font-medium text-sm sm:text-base">{item.label}</span>
                                        </Link>
                                    ))}

                                    {!isAuthenticated && (
                                        <>
                                            <div className="border-t border-slate-700 my-3 sm:my-4"></div>
                                            <Link
                                                href="/login"
                                                className="block w-full px-4 py-3.5 sm:py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 border border-slate-600/50 hover:border-indigo-500/50 text-white text-center font-medium transition-all duration-200 mb-2 touch-manipulation min-h-[44px] flex items-center justify-center"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/signup"
                                                className="block w-full px-4 py-3.5 sm:py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 text-white text-center font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20 touch-manipulation min-h-[44px] flex items-center justify-center"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}

                                    {isAuthenticated && (
                                        <>
                                            <div className="border-t border-slate-700 my-3 sm:my-4"></div>
                                            <Link
                                                href="/profile"
                                                className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <FaUser className="text-indigo-400 text-base sm:text-lg" />
                                                <span className="text-white font-medium text-sm sm:text-base">Profile</span>
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <FaCog className="text-indigo-400 text-base sm:text-lg" />
                                                <span className="text-white font-medium text-sm sm:text-base">Settings</span>
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg hover:bg-slate-800/50 active:bg-slate-700/50 transition-colors w-full text-left text-red-400 touch-manipulation min-h-[44px]"
                                            >
                                                <FaSignOutAlt className="text-base sm:text-lg" />
                                                <span className="font-medium text-sm sm:text-base">Sign Out</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Click outside to close dropdowns */}
            {(isSearchOpen || isUserMenuOpen) && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                        setIsSearchOpen(false);
                        setIsUserMenuOpen(false);
                    }}
                />
            )}

            {/* Buy Me a Coffee Modal - Render component, it handles its own modal */}
            {showCoffeeModal && (
                <BuyMeACoffeeNav onClose={() => setShowCoffeeModal(false)} />
            )}
        </>
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
                                    Support our manga platform! Every rupee helps us grow. 💖
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
