'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaBookOpen, FaSearch, FaUpload, FaUsers, FaHeart, FaStar, FaExclamationTriangle, FaWifi, FaDatabase, FaClock, FaFilter, FaPlus, FaArrowRight } from 'react-icons/fa';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: any;
    actions?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
        variant?: 'primary' | 'secondary';
    }>;
    illustration?: 'search' | 'upload' | 'bookmark' | 'error' | 'offline' | 'loading' | 'filter' | 'custom';
    className?: string;
}

// Animated Illustrations
function SearchIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1.1, 1, 1.1],
                    opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-4 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <FaSearch className="text-4xl text-blue-400" />
                </motion.div>
            </div>
            <motion.div
                animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
            >
                <span className="text-xs">?</span>
            </motion.div>
        </div>
    );
}

function UploadIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{ y: [-10, 0, -10] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        y: [-5, 0, -5]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >
                    <FaUpload className="text-4xl text-green-400" />
                </motion.div>
            </div>
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [-20, 20],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5
                    }}
                    className="absolute w-2 h-2 bg-green-400 rounded-full"
                    style={{
                        left: `${30 + i * 20}%`,
                        top: '20%'
                    }}
                />
            ))}
        </div>
    );
}

function BookmarkIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{
                    rotateY: [0, 180, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <FaBookOpen className="text-4xl text-purple-400" />
                </motion.div>
            </div>
            <motion.div
                animate={{
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute top-2 right-2"
            >
                <FaHeart className="text-lg text-pink-400" />
            </motion.div>
        </div>
    );
}

function ErrorIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <FaExclamationTriangle className="text-4xl text-red-400" />
                </motion.div>
            </div>
            <motion.div
                animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
            />
        </div>
    );
}

function OfflineIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{
                    opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 0.9, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <FaWifi className="text-4xl text-gray-400" />
                </motion.div>
            </div>
            <motion.div
                animate={{
                    rotate: [0, 360]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-gray-400 rounded-full"
            />
        </div>
    );
}

function LoadingIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-indigo-500 rounded-full"
            />
            <motion.div
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-2 border-transparent border-b-purple-500 border-l-purple-500 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <FaClock className="text-2xl text-indigo-400" />
                </motion.div>
            </div>
        </div>
    );
}

function FilterIllustration() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
                animate={{
                    scaleX: [1, 1.1, 1],
                    scaleY: [1, 0.9, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        y: [0, -5, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <FaFilter className="text-4xl text-cyan-400" />
                </motion.div>
            </div>
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        x: [-10, 10, -10],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                    }}
                    className="absolute w-1 h-8 bg-cyan-400 rounded-full"
                    style={{
                        left: `${40 + i * 10}%`,
                        top: '30%'
                    }}
                />
            ))}
        </div>
    );
}

const illustrations = {
    search: SearchIllustration,
    upload: UploadIllustration,
    bookmark: BookmarkIllustration,
    error: ErrorIllustration,
    offline: OfflineIllustration,
    loading: LoadingIllustration,
    filter: FilterIllustration,
    custom: () => null
};

export default function EmptyState({
    title,
    description,
    icon: Icon,
    actions = [],
    illustration = 'search',
    className = ''
}: EmptyStateProps) {
    const IllustrationComponent = illustrations[illustration];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-center py-20 px-4 ${className}`}
        >
            {/* Illustration */}
            {illustration !== 'custom' && <IllustrationComponent />}

            {/* Custom Icon */}
            {Icon && illustration === 'custom' && (
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                    <Icon className="text-4xl text-indigo-400" />
                </motion.div>
            )}

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-md mx-auto"
            >
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">{description}</p>

                {/* Actions */}
                {actions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        {actions.map((action, index) => (
                            action.href ? (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className={`btn ${action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'} btn-lg group`}
                                >
                                    {action.label}
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ) : (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={`btn ${action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'} btn-lg group`}
                                >
                                    {action.label}
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}

// Specific Empty State Components
export function NoMangaFound({ searchQuery = '', onClearFilters }: { searchQuery?: string; onClearFilters?: () => void }) {
    return (
        <EmptyState
            title="No manga found"
            description={searchQuery
                ? `No results found for "${searchQuery}". Try different keywords or browse our collection.`
                : "No manga matches your current filters. Try adjusting your search criteria."
            }
            illustration="search"
            actions={[
                ...(onClearFilters ? [{ label: "Clear Filters", onClick: onClearFilters, variant: "secondary" as const }] : []),
                { label: "Browse All Manga", href: "/manga", variant: "primary" as const }
            ]}
        />
    );
}

export function EmptyLibrary() {
    return (
        <EmptyState
            title="Your library is empty"
            description="Start building your personal manga collection by bookmarking your favorite series. Discover amazing stories waiting for you!"
            illustration="bookmark"
            actions={[
                { label: "Discover Manga", href: "/manga", variant: "primary" },
                { label: "Browse Genres", href: "/genres", variant: "secondary" }
            ]}
        />
    );
}

export function NoReadingHistory() {
    return (
        <EmptyState
            title="No reading history yet"
            description="Your reading journey starts here! Explore our vast collection of manga and start reading your first chapter."
            illustration="bookmark"
            actions={[
                { label: "Start Reading", href: "/manga", variant: "primary" },
                { label: "Featured Manga", href: "/?section=featured", variant: "secondary" }
            ]}
        />
    );
}

export function UploadPrompt() {
    return (
        <EmptyState
            title="Ready to share your story?"
            description="Upload your manga and share your creativity with thousands of readers. Join our community of talented creators!"
            illustration="upload"
            actions={[
                { label: "Upload Manga", href: "/upload", variant: "primary" },
                { label: "Creator Guide", href: "/help/creators", variant: "secondary" }
            ]}
        />
    );
}

export function OfflineState() {
    return (
        <EmptyState
            title="You're offline"
            description="Check your internet connection and try again. Some content may still be available from your cache."
            illustration="offline"
            actions={[
                { label: "Try Again", onClick: () => window.location.reload(), variant: "primary" },
                { label: "Offline Content", href: "/offline", variant: "secondary" }
            ]}
        />
    );
}

export function LoadingState({ message = "Loading amazing content..." }: { message?: string }) {
    return (
        <EmptyState
            title="Just a moment..."
            description={message}
            illustration="loading"
        />
    );
}

export function ErrorState({
    title = "Something went wrong",
    description = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
    onRetry
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            title={title}
            description={description}
            illustration="error"
            actions={[
                ...(onRetry ? [{ label: "Try Again", onClick: onRetry, variant: "primary" as const }] : []),
                { label: "Go Home", href: "/", variant: "secondary" as const },
                { label: "Contact Support", href: "/help", variant: "secondary" as const }
            ]}
        />
    );
}





