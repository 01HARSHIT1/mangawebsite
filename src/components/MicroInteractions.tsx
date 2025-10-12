'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaBookmark, FaStar, FaShare, FaPlay, FaThumbsUp } from 'react-icons/fa';

// Ripple Effect Component
export function RippleButton({
    children,
    className = '',
    onClick,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    [key: string]: any;
}) {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = { id: Date.now(), x, y };
        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);

        onClick?.(e);
    };

    return (
        <button
            {...props}
            onClick={handleClick}
            className={`relative overflow-hidden ${className}`}
        >
            {children}

            {ripples.map(ripple => (
                <motion.span
                    key={ripple.id}
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute bg-white/30 rounded-full pointer-events-none"
                    style={{
                        left: ripple.x - 10,
                        top: ripple.y - 10,
                        width: 20,
                        height: 20,
                    }}
                />
            ))}
        </button>
    );
}

// Floating Action Button with Animations
export function FloatingActionButton({
    icon: Icon,
    label,
    onClick,
    color = 'indigo',
    position = 'bottom-right'
}: {
    icon: any;
    label: string;
    onClick: () => void;
    color?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const positionClasses = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6'
    };

    return (
        <motion.div
            className={`fixed ${positionClasses[position]} z-50`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <RippleButton
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                onClick={onClick}
                className={`bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700 text-white rounded-full shadow-2xl transition-all duration-300 flex items-center space-x-3 ${isExpanded ? 'px-6 py-4' : 'p-4'
                    }`}
            >
                <Icon className="text-xl" />
                <motion.span
                    initial={false}
                    animate={{
                        width: isExpanded ? 'auto' : 0,
                        opacity: isExpanded ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="font-semibold whitespace-nowrap overflow-hidden"
                >
                    {label}
                </motion.span>
            </RippleButton>
        </motion.div>
    );
}

// Interactive Like Button
export function InteractiveLikeButton({
    initialLiked = false,
    likeCount = 0,
    onLike
}: {
    initialLiked?: boolean;
    likeCount?: number;
    onLike?: (liked: boolean) => void;
}) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(likeCount);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLike = () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : prev - 1);
        setIsAnimating(true);

        setTimeout(() => setIsAnimating(false), 600);
        onLike?.(newLiked);
    };

    return (
        <RippleButton
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${liked
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white'
                }`}
        >
            <motion.div
                animate={isAnimating ? {
                    scale: [1, 1.3, 1],
                    rotate: [0, 15, -15, 0]
                } : {}}
                transition={{ duration: 0.6 }}
            >
                <FaHeart className={liked ? 'text-white' : 'text-gray-400'} />
            </motion.div>

            <motion.span
                key={count}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-medium text-sm"
            >
                {count}
            </motion.span>
        </RippleButton>
    );
}

// Animated Bookmark Button
export function AnimatedBookmarkButton({
    initialBookmarked = false,
    onBookmark
}: {
    initialBookmarked?: boolean;
    onBookmark?: (bookmarked: boolean) => void;
}) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);

    const handleBookmark = () => {
        const newBookmarked = !bookmarked;
        setBookmarked(newBookmarked);
        onBookmark?.(newBookmarked);
    };

    return (
        <motion.button
            onClick={handleBookmark}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-3 rounded-full transition-all duration-300 ${bookmarked
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/25'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white'
                }`}
        >
            <motion.div
                animate={bookmarked ? {
                    scale: [1, 0.8, 1.2, 1],
                    rotate: [0, -10, 10, 0]
                } : {}}
                transition={{ duration: 0.5 }}
            >
                <FaBookmark />
            </motion.div>
        </motion.button>
    );
}

// Hover Card Component
export function HoverCard({
    children,
    hoverContent,
    delay = 0.5
}: {
    children: React.ReactNode;
    hoverContent: React.ReactNode;
    delay?: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (isHovered) {
            timeoutRef.current = setTimeout(() => setShowContent(true), delay * 1000);
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setShowContent(false);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isHovered, delay]);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}

            {showContent && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                >
                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-2xl max-w-xs">
                        {hoverContent}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Animated Counter
export function AnimatedCounter({
    value,
    duration = 1,
    prefix = '',
    suffix = ''
}: {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}) {
    const [displayValue, setDisplayValue] = useState(0);
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (inView) {
            controls.start({
                opacity: 1,
                y: 0,
                transition: { duration: 0.5 }
            });

            let startTime: number;
            const animateValue = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

                setDisplayValue(Math.floor(progress * value));

                if (progress < 1) {
                    requestAnimationFrame(animateValue);
                }
            };

            requestAnimationFrame(animateValue);
        }
    }, [inView, value, duration, controls]);

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="font-bold"
        >
            {prefix}{displayValue.toLocaleString()}{suffix}
        </motion.span>
    );
}

// Stagger Animation Container
export function StaggerContainer({
    children,
    staggerDelay = 0.1,
    className = ''
}: {
    children: React.ReactNode;
    staggerDelay?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div ref={ref} className={className}>
            {Array.isArray(children)
                ? children.map((child, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{
                            duration: 0.6,
                            delay: index * staggerDelay,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                    >
                        {child}
                    </motion.div>
                ))
                : children
            }
        </div>
    );
}

// Magnetic Button Effect
export function MagneticButton({
    children,
    className = '',
    strength = 0.3,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    strength?: number;
    [key: string]: any;
}) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * strength;
        const deltaY = (e.clientY - centerY) * strength;

        setPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.button
            ref={ref}
            {...props}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`transition-all duration-200 ${className}`}
        >
            {children}
        </motion.button>
    );
}

// Parallax Element
export function ParallaxElement({
    children,
    speed = 0.5,
    className = ''
}: {
    children: React.ReactNode;
    speed?: number;
    className?: string;
}) {
    const [offsetY, setOffsetY] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;

            if (rect.top < window.innerHeight && rect.bottom > 0) {
                setOffsetY(rate);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return (
        <div ref={ref} className={className}>
            <motion.div
                style={{ y: offsetY }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
                {children}
            </motion.div>
        </div>
    );
}





