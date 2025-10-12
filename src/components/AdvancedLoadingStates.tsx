'use client';

import { motion } from 'framer-motion';
import { FaSpinner, FaBook, FaHeart, FaStar } from 'react-icons/fa';

// Skeleton Components
export function MangaCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'horizontal' | 'compact' }) {
    return (
        <div className={`animate-pulse ${variant === 'horizontal' ? 'flex space-x-4' : 'space-y-4'
            }`}>
            <div className={`bg-slate-700 rounded-xl ${variant === 'horizontal' ? 'w-32 h-40 flex-shrink-0' : 'aspect-[3/4] w-full'
                }`} />
            <div className={`space-y-3 ${variant === 'horizontal' ? 'flex-1' : ''}`}>
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
                <div className="flex space-x-2">
                    <div className="h-5 bg-slate-800 rounded-full w-16" />
                    <div className="h-5 bg-slate-800 rounded-full w-20" />
                </div>
                {variant !== 'compact' && (
                    <>
                        <div className="h-3 bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-800 rounded w-2/3" />
                    </>
                )}
            </div>
        </div>
    );
}

export function MangaGridSkeleton({ count = 12, variant = 'default' }: { count?: number; variant?: 'default' | 'horizontal' | 'compact' }) {
    return (
        <div className={`grid gap-6 ${variant === 'horizontal' ? 'grid-cols-1' :
                variant === 'compact' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
                    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}>
            {[...Array(count)].map((_, i) => (
                <MangaCardSkeleton key={i} variant={variant} />
            ))}
        </div>
    );
}

export function NavigationSkeleton() {
    return (
        <div className="animate-pulse bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
            <div className="container-fluid">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                        <div className="hidden md:block space-y-1">
                            <div className="h-4 bg-slate-700 rounded w-32" />
                            <div className="h-2 bg-slate-800 rounded w-20" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-64 h-10 bg-slate-700 rounded-lg" />
                        <div className="w-10 h-10 bg-slate-700 rounded-lg" />
                        <div className="w-10 h-10 bg-slate-700 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HeroSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center animate-pulse">
            <div className="text-center space-y-8">
                <div className="space-y-4">
                    <div className="h-16 bg-slate-700 rounded w-96 mx-auto" />
                    <div className="h-16 bg-slate-800 rounded w-80 mx-auto" />
                </div>
                <div className="h-6 bg-slate-800 rounded w-[600px] mx-auto" />
                <div className="h-6 bg-slate-800 rounded w-[500px] mx-auto" />
                <div className="flex justify-center space-x-6">
                    <div className="h-12 bg-slate-700 rounded w-40" />
                    <div className="h-12 bg-slate-800 rounded w-32" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="text-center space-y-2">
                            <div className="h-8 bg-slate-700 rounded w-16 mx-auto" />
                            <div className="h-4 bg-slate-800 rounded w-20 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Advanced Loading Spinners
export function PulseLoader({ size = 'md', color = 'indigo' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className="flex justify-center items-center">
            <div className={`${sizeClasses[size]} relative`}>
                <div className={`absolute inset-0 bg-${color}-500 rounded-full animate-ping opacity-75`} />
                <div className={`absolute inset-0 bg-${color}-600 rounded-full animate-pulse`} />
            </div>
        </div>
    );
}

export function SpinnerLoader({ size = 'md', color = 'indigo' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className="flex justify-center items-center">
            <FaSpinner className={`${sizeClasses[size]} text-${color}-500 animate-spin`} />
        </div>
    );
}

export function DotsLoader({ color = 'indigo' }: { color?: string }) {
    return (
        <div className="flex justify-center items-center space-x-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`w-3 h-3 bg-${color}-500 rounded-full`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2
                    }}
                />
            ))}
        </div>
    );
}

export function ProgressLoader({ progress, color = 'indigo' }: { progress: number; color?: string }) {
    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
                <span>Loading...</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                    className={`bg-gradient-to-r from-${color}-500 to-${color}-600 h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}

// Content Loading States
export function ContentLoader({
    title,
    description,
    icon: Icon = FaBook,
    color = 'indigo'
}: {
    title: string;
    description?: string;
    icon?: any;
    color?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                }}
                className={`w-16 h-16 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-full flex items-center justify-center mb-6 shadow-lg`}
            >
                <Icon className="text-white text-2xl" />
            </motion.div>

            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            {description && (
                <p className="text-gray-400 max-w-md">{description}</p>
            )}

            <DotsLoader color={color} />
        </div>
    );
}

// Page Loading Overlay
export function PageLoadingOverlay({ message = "Loading..." }: { message?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <div className="text-center space-y-6">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-2xl"
                >
                    <FaBook className="text-white text-3xl" />
                </motion.div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{message}</h3>
                    <DotsLoader />
                </div>
            </div>
        </motion.div>
    );
}

// Smart Loading Button
export function LoadingButton({
    loading,
    children,
    className = '',
    ...props
}: {
    loading: boolean;
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
}) {
    return (
        <button
            {...props}
            disabled={loading}
            className={`relative overflow-hidden transition-all duration-300 ${loading ? 'cursor-not-allowed opacity-80' : ''
                } ${className}`}
        >
            <motion.div
                animate={{ opacity: loading ? 0 : 1, y: loading ? -20 : 0 }}
                transition={{ duration: 0.2 }}
            >
                {children}
            </motion.div>

            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <SpinnerLoader size="sm" color="white" />
                </motion.div>
            )}
        </button>
    );
}

// Image Loading Component
export function AdvancedImageLoader({
    src,
    alt,
    className = '',
    ...props
}: {
    src: string;
    alt: string;
    className?: string;
    [key: string]: any;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-slate-700 animate-pulse flex items-center justify-center">
                    <PulseLoader />
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <FaBook className="text-4xl mb-2 mx-auto opacity-50" />
                        <p className="text-sm">Image failed to load</p>
                    </div>
                </div>
            ) : (
                <motion.img
                    {...props}
                    src={src}
                    alt={alt}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: loading ? 0 : 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
}





