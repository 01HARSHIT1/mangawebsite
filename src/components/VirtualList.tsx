"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
    onScroll?: (scrollTop: number) => void;
}

export default function VirtualList<T>({
    items,
    height,
    itemHeight,
    renderItem,
    overscan = 5,
    className = '',
    onScroll
}: VirtualListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate visible range
    const visibleRange = useMemo(() => {
        const start = Math.floor(scrollTop / itemHeight);
        const visibleCount = Math.ceil(height / itemHeight);
        const end = Math.min(start + visibleCount + overscan, items.length);
        const startIndex = Math.max(0, start - overscan);
        return { start: startIndex, end };
    }, [scrollTop, itemHeight, height, overscan, items.length]);

    // Calculate total height
    const totalHeight = items.length * itemHeight;

    // Handle scroll
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = event.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
    }, [onScroll]);

    // Scroll to specific item
    const scrollToItem = useCallback((index: number) => {
        if (containerRef.current) {
            const scrollTop = index * itemHeight;
            containerRef.current.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }, [itemHeight]);

    // Scroll to top
    const scrollToTop = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, []);

    // Get visible items
    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
            item,
            index: visibleRange.start + index
        }));
    }, [items, visibleRange]);

    // Calculate transform offset
    const transformOffset = visibleRange.start * itemHeight;

    return (
        <div className={`relative ${className}`} style={{ height }}>
            {/* Scrollable container */}
            <div
                ref={containerRef}
                className="overflow-auto h-full"
                onScroll={handleScroll}
                style={{ height }}
            >
                {/* Spacer for total height */}
                <div style={{ height: totalHeight }}>
                    {/* Visible items container */}
                    <div
                        style={{
                            transform: `translateY(${transformOffset}px)`,
                            position: 'relative'
                        }}
                    >
                        {visibleItems.map(({ item, index }) => (
                            <motion.div
                                key={item._id ? item._id : index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ height: itemHeight }}
                            >
                                {renderItem(item, index)}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Scroll to top button */}
            {scrollTop > 200 && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg transition-colors z-50"
                    title="Scroll to top"
                >
                    ↑
                </motion.button>
            )}
        </div>
    );
}

// Hook for virtual list state
export function useVirtualList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) {
    const [scrollTop, setScrollTop] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

    useEffect(() => {
        const start = Math.floor(scrollTop / itemHeight);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = Math.min(start + visibleCount, items.length);
        setVisibleRange({ start, end });
    }, [scrollTop, itemHeight, containerHeight, items.length]);

    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.start, visibleRange.end);
    }, [items, visibleRange]);

    return {
        scrollTop,
        setScrollTop,
        visibleRange,
        visibleItems,
        totalHeight: items.length * itemHeight
    };
} 