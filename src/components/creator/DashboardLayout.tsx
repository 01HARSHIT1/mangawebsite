'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaHome, FaBookOpen, FaChartLine, FaDollarSign, FaComments, 
    FaCog, FaUpload, FaBars, FaTimes, FaBook, FaMoneyBillWave,
    FaBell, FaQuestionCircle, FaSignOutAlt, FaTags, FaUsers
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const navigationItems = [
        { 
            label: 'Overview', 
            href: '/creator/dashboard', 
            icon: FaHome,
            description: 'Dashboard home'
        },
        { 
            label: 'My Series', 
            href: '/creator/dashboard/series', 
            icon: FaBookOpen,
            description: 'Manage your manga'
        },
        { 
            label: 'Upload', 
            href: '/upload/intro?mode=manga&returnTo=/creator/dashboard/upload', 
            icon: FaUpload,
            description: 'Upload new content'
        },
        { 
            label: 'Analytics', 
            href: '/creator/dashboard/analytics', 
            icon: FaChartLine,
            description: 'Performance metrics'
        },
        { 
            label: 'Earnings', 
            href: '/creator/dashboard/earnings', 
            icon: FaDollarSign,
            description: 'Revenue & payouts'
        },
        { 
            label: 'Comments', 
            href: '/creator/dashboard/comments', 
            icon: FaComments,
            description: 'Moderate discussions'
        },
        { 
            label: 'Monetization', 
            href: '/creator/dashboard/monetization', 
            icon: FaMoneyBillWave,
            description: 'Pricing & subscriptions'
        },
        { 
            label: 'Settings', 
            href: '/creator/dashboard/settings', 
            icon: FaCog,
            description: 'Account preferences'
        }
    ];

    const isActive = (href: string) => {
        if (href === '/creator/dashboard') {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-40">
                <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
                    {/* Left: Logo & Menu Toggle */}
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:block p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <FaBars className="text-gray-400" />
                        </button>
                        
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            aria-label="Toggle mobile menu"
                        >
                            <FaBars className="text-gray-400" />
                        </button>

                        <Link href="/creator/dashboard" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <div className="hidden sm:block min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-white truncate">Creator Studio</h1>
                                <p className="text-xs text-gray-400 -mt-1 truncate">Professional Dashboard</p>
                            </div>
                        </Link>
                    </div>

                    {/* Right: Actions & User */}
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0 ml-2">
                        {/* Back to Site */}
                        <Link
                            href="/"
                            className="hidden md:flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors whitespace-nowrap"
                        >
                            <FaHome className="text-gray-400 text-sm" />
                            <span className="text-sm text-gray-300">Back to Site</span>
                        </Link>

                        {/* Notifications */}
                        <Link
                            href="/notifications"
                            className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
                            aria-label="Notifications"
                        >
                            <FaBell className="text-gray-400" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </Link>

                        {/* Help */}
                        <Link
                            href="/help"
                            className="p-2 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
                            aria-label="Help"
                        >
                            <FaQuestionCircle className="text-gray-400" />
                        </Link>

                        {/* User Menu */}
                        <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                    {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="hidden lg:block min-w-0">
                                <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                                    {user?.username || user?.email || 'User'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {user?.role === 'admin' ? 'Admin' : 'Creator'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Desktop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 overflow-y-auto z-30"
                    >
                        <nav className="p-4 space-y-2">
                            {navigationItems.map((item) => {
                                const IconComponent = item.icon;
                                const Icon =
                                    typeof IconComponent === 'function'
                                        ? IconComponent
                                        : FaQuestionCircle;
                                const active = isActive(item.href);
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            active
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon className={`text-lg ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <div className="flex-1">
                                            <p className={`font-semibold ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-gray-500 group-hover:text-gray-400">
                                                {item.description}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* Divider */}
                            <div className="my-4 border-t border-slate-700"></div>

                            {/* Additional Links */}
                            <Link
                                href="/help"
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
                            >
                                <FaQuestionCircle />
                                <span className="font-medium">Help & Docs</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
                            >
                                <FaSignOutAlt />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-700">
                            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/20">
                                <p className="text-xs text-gray-400 mb-2">Creator Studio</p>
                                <p className="text-sm font-semibold text-white">v1.0.0</p>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 top-16"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-slate-700 overflow-y-auto z-50"
                        >
                            <nav className="p-4 space-y-2">
                                {navigationItems.map((item) => {
                                    const IconComponent = item.icon;
                                    const Icon =
                                        typeof IconComponent === 'function'
                                            ? IconComponent
                                            : FaQuestionCircle;
                                    const active = isActive(item.href);
                                    
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                                active
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        >
                                            <Icon className="text-lg" />
                                            <span className="font-semibold">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

