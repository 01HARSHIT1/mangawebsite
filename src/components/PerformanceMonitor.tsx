'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
    pageLoadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    url: string;
    userAgent: string;
    timestamp: string;
    userId?: string;
}

const PerformanceMonitor: React.FC = () => {
    const metricsRef = useRef<PerformanceMetrics | null>(null);
    const observerRef = useRef<PerformanceObserver | null>(null);

    // Track user interactions
    const trackUserInteractions = () => {
        let interactionCount = 0;
        let lastInteractionTime = Date.now();

        const trackInteraction = () => {
            interactionCount++;
            lastInteractionTime = Date.now();
        };

        // Track clicks
        document.addEventListener('click', trackInteraction);

        // Track scrolls (throttled)
        let scrollTimeout: NodeJS.Timeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackInteraction, 100);
        });

        // Track key presses
        document.addEventListener('keydown', trackInteraction);

        // Track form interactions
        document.addEventListener('input', trackInteraction);
        document.addEventListener('submit', trackInteraction);

        // Store interaction data
        window.addEventListener('beforeunload', () => {
            const sessionData = {
                interactionCount,
                sessionDuration: Date.now() - lastInteractionTime,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('sessionData', JSON.stringify(sessionData));
        });
    };

    // Send performance metrics to backend
    const sendPerformanceMetrics = async () => {
        if (!metricsRef.current) return;

        try {
            // Get session data
            const sessionDataStr = localStorage.getItem('sessionData');
            const sessionData = sessionDataStr ? JSON.parse(sessionDataStr) : null;

            const metrics = {
                ...metricsRef.current,
                sessionData
            };

            // Send to backend
            await fetch('/api/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metrics)
            });

            // Clear session data
            localStorage.removeItem('sessionData');
        } catch (error) {
            console.warn('Failed to send performance metrics:', error);
        }
    };

    useEffect(() => {
        // Initialize performance monitoring
        const initPerformanceMonitoring = () => {
            const url = window.location.href;
            const userAgent = navigator.userAgent;
            const userId = localStorage.getItem('userId') || undefined;

            // Basic page load metrics
            const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;

            metricsRef.current = {
                pageLoadTime,
                domContentLoaded,
                firstContentfulPaint: 0,
                largestContentfulPaint: 0,
                firstInputDelay: 0,
                cumulativeLayoutShift: 0,
                url,
                userAgent,
                timestamp: new Date().toISOString(),
                userId
            };
        };

        // Observe First Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                observerRef.current = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'first-contentful-paint' && metricsRef.current) {
                            metricsRef.current.firstContentfulPaint = entry.startTime;
                        }
                    });
                });
                observerRef.current.observe({ entryTypes: ['first-contentful-paint'] });
            } catch (error) {
                console.warn('PerformanceObserver not supported:', error);
            }
        }

        // Observe Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry && metricsRef.current) {
                        metricsRef.current.largestContentfulPaint = lastEntry.startTime;
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (error) {
                console.warn('LCP PerformanceObserver not supported:', error);
            }
        }

        // Observe First Input Delay
        if ('PerformanceObserver' in window) {
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'first-input' && metricsRef.current) {
                            metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (error) {
                console.warn('FID PerformanceObserver not supported:', error);
            }
        }

        // Observe Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    let clsValue = 0;
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    if (metricsRef.current) {
                        metricsRef.current.cumulativeLayoutShift = clsValue;
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                console.warn('CLS PerformanceObserver not supported:', error);
            }
        }

        // Track user interactions
        trackUserInteractions();

        // Send metrics after page load
        setTimeout(() => {
            sendPerformanceMetrics();
        }, 5000); // Wait 5 seconds to capture all metrics

        // Route change handler
        const handleRouteChange = () => {
            // Reset metrics for new page
            metricsRef.current = null;

            // Re-initialize monitoring after a short delay
            setTimeout(() => {
                initPerformanceMonitoring();
            }, 100);
        };

        // Listen for route changes (Next.js)
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            window.removeEventListener('popstate', handleRouteChange);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return null; // This component doesnt render anything
}

export default PerformanceMonitor; 