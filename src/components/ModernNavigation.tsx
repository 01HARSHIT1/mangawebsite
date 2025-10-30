'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaSearch, FaBell, FaUser, FaBookmark, FaChartBar, FaUpload, FaCog, FaSignOutAlt, FaBars, FaTimes, FaHome, FaBook, FaTags, FaCoins, FaCrown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModernNavigation() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const { isAuthenticated, user, logout, isCreator } = useAuth();
    const router = useRouter();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const creatorNavItems = isCreator ? [
        { href: '/upload', label: 'Upload', icon: FaUpload },
        { href: '/creator/dashboard', label: 'Dashboard', icon: FaCrown },
    ] : [];

    return (
        <>
            {/* Main Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'glass-strong shadow-xl border-b border-white/10'
                : 'bg-transparent'
                }`}>
                <div className="container-fluid">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <span className="text-white font-bold text-lg">M</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300"></div>
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold text-gradient">MangaReader</h1>
                                <p className="text-xs text-gray-400 -mt-1">Professional Platform</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="nav-link flex items-center space-x-2 px-4 py-2"
                                >
                                    <item.icon className="text-sm" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}

                            {userNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="nav-link flex items-center space-x-2 px-4 py-2"
                                >
                                    <item.icon className="text-sm" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}

                            {creatorNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="nav-link flex items-center space-x-2 px-4 py-2"
                                >
                                    <item.icon className="text-sm" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200"
                                >
                                    <FaSearch className="text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {isSearchOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-full mt-2 w-80 search-container"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Search manga, creators, genres..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="input focus-ring"
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

                            {/* Notifications */}
                            {isAuthenticated && (
                                <Link
                                    href="/notifications"
                                    className="relative p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200"
                                >
                                    <FaBell className="text-gray-400" />
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                                </Link>
                            )}

                            {/* User Menu */}
                            {isAuthenticated ? (
                                <div className="relative dropdown">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">
                                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <span className="hidden md:block text-sm font-medium text-white">
                                            {user?.username || 'User'}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="dropdown-menu right-0"
                                            >
                                                <Link href="/profile" className="dropdown-item flex items-center space-x-3">
                                                    <FaUser />
                                                    <span>Profile</span>
                                                </Link>
                                                <Link href="/library" className="dropdown-item flex items-center space-x-3">
                                                    <FaBookmark />
                                                    <span>Library</span>
                                                </Link>
                                                <Link href="/stats" className="dropdown-item flex items-center space-x-3">
                                                    <FaChartBar />
                                                    <span>Statistics</span>
                                                </Link>
                                                <div className="border-t border-slate-700 my-2"></div>
                                                <Link href="/settings" className="dropdown-item flex items-center space-x-3">
                                                    <FaCog />
                                                    <span>Settings</span>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="dropdown-item flex items-center space-x-3 w-full text-left text-red-400 hover:text-red-300"
                                                >
                                                    <FaSignOutAlt />
                                                    <span>Sign Out</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link href="/login" className="btn btn-ghost btn-sm">
                                        Sign In
                                    </Link>
                                    <Link href="/signup" className="btn btn-primary btn-sm">
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-200 text-white"
                            >
                                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
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

                        {/* Mobile Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-0 right-0 h-full w-80 max-w-[80vw] glass-strong border-l border-white/10 z-50 lg:hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-white">Menu</h2>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Navigation Items */}
                                    {[...navItems, ...userNavItems, ...creatorNavItems].map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <item.icon className="text-indigo-400" />
                                            <span className="text-white font-medium">{item.label}</span>
                                        </Link>
                                    ))}

                                    {/* Policy Pages */}
                                    <div className="border-t border-slate-700 my-4"></div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-3">Legal</h3>
                                    {policyItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <item.icon className="text-slate-400" />
                                            <span className="text-slate-300 font-medium">{item.label}</span>
                                        </Link>
                                    ))}

                                    {!isAuthenticated && (
                                        <>
                                            <div className="border-t border-slate-700 my-4"></div>
                                            <Link
                                                href="/login"
                                                className="block w-full btn btn-ghost text-center"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/signup"
                                                className="block w-full btn btn-primary text-center"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}

                                    {isAuthenticated && (
                                        <>
                                            <div className="border-t border-slate-700 my-4"></div>
                                            <Link
                                                href="/profile"
                                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <FaUser className="text-indigo-400" />
                                                <span className="text-white font-medium">Profile</span>
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <FaCog className="text-indigo-400" />
                                                <span className="text-white font-medium">Settings</span>
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors w-full text-left text-red-400"
                                            >
                                                <FaSignOutAlt />
                                                <span className="font-medium">Sign Out</span>
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
        </>
    );
}
