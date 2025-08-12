"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FaUserPlus, FaSignInAlt, FaCrown, FaUserCircle, FaTachometerAlt, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Debug logging
    useEffect(() => {
        console.log('Navigation: State changed:', {
            user: user?.nickname,
            loading,
            isAuthenticated,
            timestamp: new Date().toISOString()
        });
    }, [user, loading, isAuthenticated]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setShowMobileMenu(false);
            }
        }

        if (showMobileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMobileMenu]);

    // Show loading state while AuthContext is initializing
    if (loading) {
        console.log('Navigation: Showing loading state');
        return (
            <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 shadow-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-2xl font-bold text-green-400">MangaReader</Link>
                    <Link href="/series" className="ml-6 hover:text-green-300">Series</Link>
                    <Link href="/search" className="ml-4 hover:text-green-300">Search</Link>
                    <Link href="/upload" className="ml-4 hover:text-green-300">Upload</Link>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <div className="animate-pulse bg-gray-700 h-8 w-20 rounded"></div>
                </div>
            </nav>
        );
    }

    console.log('Navigation: Rendering with user:', user?.nickname, 'isAuthenticated:', isAuthenticated, 'timestamp:', new Date().toISOString());

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-2xl font-bold text-green-400">MangaReader</Link>
                <Link href="/series" className="ml-6 hover:text-green-300">Series</Link>
                <Link href="/search" className="ml-4 hover:text-green-300">Search</Link>
                <Link href="/upload" className="ml-4 hover:text-green-300">Upload</Link>
            </div>

            {/* Debug info - remove this later */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mr-4">
                    Auth: {isAuthenticated ? 'YES' : 'NO'} |
                    User: {isAuthenticated && user ? `${user.nickname} (${user.role})` : 'None'} |
                    Loading: {loading ? 'YES' : 'NO'}
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            sessionStorage.removeItem('clearAuthOnStart');
                            window.location.reload();
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 underline"
                        title="Clear auth (dev only)"
                    >
                        Clear Auth
                    </button>
                </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
                {!isAuthenticated ? (
                    // Show login/signup for non-authenticated users
                    <>
                        <Link href="/signup" className="flex items-center gap-2 px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold">
                            <FaUserPlus />Sign Up
                        </Link>
                        <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                            <FaSignInAlt />Log In
                        </Link>
                    </>
                ) : (
                    // Show user-specific options for authenticated users
                    <>
                        <Link href="/creator-panel" className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                            <FaCrown />Creator Panel
                        </Link>
                        {user?.role === 'admin' && (
                            <Link href="/admin-dashboard" className="flex items-center gap-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold">
                                <FaTachometerAlt />Admin Dashboard
                            </Link>
                        )}
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white font-semibold">
                            <FaUserCircle />Profile
                        </Link>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                            <FaSignOutAlt />Logout
                        </button>
                    </>
                )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="text-white hover:text-green-300"
                >
                    {showMobileMenu ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {showMobileMenu && (
                <div
                    ref={mobileMenuRef}
                    className="absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-700 md:hidden"
                >
                    <div className="flex flex-col p-4 space-y-2">
                        {!isAuthenticated ? (
                            // Show login/signup for non-authenticated users
                            <>
                                <Link
                                    href="/signup"
                                    className="flex items-center gap-2 px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <FaUserPlus />Sign Up
                                </Link>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <FaSignInAlt />Log In
                                </Link>
                            </>
                        ) : (
                            // Show user-specific options for authenticated users
                            <>
                                <Link
                                    href="/creator-panel"
                                    className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <FaCrown />Creator Panel
                                </Link>
                                {user?.role === 'admin' && (
                                    <Link
                                        href="/admin-dashboard"
                                        className="flex items-center gap-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <FaTachometerAlt />Admin Dashboard
                                    </Link>
                                )}
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white font-semibold"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <FaUserCircle />Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold w-full text-left"
                                >
                                    <FaSignOutAlt />Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
} 