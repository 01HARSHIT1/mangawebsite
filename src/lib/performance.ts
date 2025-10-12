interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    category: 'navigation' | 'interaction' | 'resource';
    metadata?: Record<string, any>;
}

interface PerformanceConfig {
    enableTracking: boolean;
    sampleRate: number; // percentage of users to track
    maxMetrics: number;
    sendToAnalytics: boolean;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private config: PerformanceConfig;
    private observer: PerformanceObserver | null = null;

    constructor(config: Partial<PerformanceConfig> = {}) {
        this.config = {
            enableTracking: true,
            sampleRate: 0.1, // Track 10% of users
            maxMetrics: 1000,
            sendToAnalytics: false,
            ...config
        };

        if (this.config.enableTracking && Math.random() < this.config.sampleRate) {
            this.init();
        }
    }

    private init() {
        this.trackNavigationTiming();
        this.trackResourceTiming();
        this.trackUserInteractions();
        this.trackMemoryUsage();
    }

    // Track page navigation timing
    private trackNavigationTiming() {
        if (typeof window !== 'undefined' && 'performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.addMetric({
                    name: 'page_load',
                    value: navigation.loadEventEnd - navigation.loadEventStart,
                    timestamp: Date.now(),
                    category: 'navigation',
                    metadata: {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        firstPaint: this.getFirstPaint(),
                        firstContentfulPaint: this.getFirstContentfulPaint(),
                        url: window.location.href
                    }
                });
            }
        }
    }

    // Track resource loading
    private trackResourceTiming() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            this.observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'resource') {
                        const resourceEntry = entry as PerformanceResourceTiming;
                        this.addMetric({
                            name: 'resource_load',
                            value: resourceEntry.duration,
                            timestamp: Date.now(),
                            category: 'resource',
                            metadata: {
                                name: resourceEntry.name,
                                type: resourceEntry.initiatorType,
                                size: resourceEntry.transferSize
                            }
                        });
                    }
                }
            });

            this.observer.observe({ entryTypes: ['resource'] });
        }
    }

    // Track user interactions
    private trackUserInteractions() {
        if (typeof window !== 'undefined') {
            let interactionStart = 0;
            // Track click interactions
            document.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                this.addMetric({
                    name: 'user_click',
                    value: Date.now(),
                    timestamp: Date.now(),
                    category: 'interaction',
                    metadata: {
                        element: target.tagName,
                        className: target.className,
                        id: target.id,
                        text: target.textContent?.slice(0, 50)
                    }
                });
            }, { passive: true });

            // Track scroll performance
            let scrollTimeout: NodeJS.Timeout;
            document.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.addMetric({
                        name: 'scroll_performance',
                        value: Date.now(),
                        timestamp: Date.now(),
                        category: 'interaction',
                        metadata: {
                            scrollY: window.scrollY,
                            scrollX: window.scrollX
                        }
                    });
                }, 100);
            }, { passive: true });
        }
    }

    // Track memory usage
    private trackMemoryUsage() {
        if (typeof window !== 'undefined' && 'memory' in performance) {
            const memory = (performance as any).memory;
            this.addMetric({
                name: 'memory_usage',
                value: memory.usedJSHeapSize,
                timestamp: Date.now(),
                category: 'resource',
                metadata: {
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                }
            });
        }
    }

    // Track API response times
    trackApiCall(url: string, method: string, duration: number, status: number) {
        this.addMetric({
            name: 'api_call',
            value: duration,
            timestamp: Date.now(),
            category: 'api',
            metadata: {
                url,
                method,
                status,
                success: status >= 200 && status < 300
            }
        });
    }

    // Track custom events
    trackEvent(name: string, value: number, metadata?: Record<string, any>) {
        this.addMetric({
            name,
            value,
            timestamp: Date.now(),
            category: 'interaction',
            metadata
        });
    }

    // Add metric to collection
    private addMetric(metric: PerformanceMetric) {
        this.metrics.push(metric);

        // Keep only the latest metrics
        if (this.metrics.length > this.config.maxMetrics) {
            this.metrics = this.metrics.slice(-this.config.maxMetrics);
        }

        // Send to analytics if enabled
        if (this.config.sendToAnalytics) {
            this.sendToAnalytics(metric);
        }
    }

    // Get performance metrics
    getMetrics(category?: string): PerformanceMetric[] {
        if (category) {
            return this.metrics.filter(m => m.category === category);
        }
        return [...this.metrics];
    }

    // Get average metric value
    getAverageMetric(name: string): number {
        const metrics = this.metrics.filter(m => m.name === name);
        if (metrics.length === 0) return 0;
        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        return sum / metrics.length;
    }

    // Get slowest API calls
    getSlowestApiCalls(limit = 10): PerformanceMetric[] {
        return this.metrics
            .filter(m => m.category === 'api')
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }

    // Get performance summary
    getPerformanceSummary() {
        const navigationMetrics = this.getMetrics('navigation');
        const apiMetrics = this.getMetrics('api');
        const resourceMetrics = this.getMetrics('resource');

        return {
            pageLoadTime: this.getAverageMetric('page_load'),
            averageApiResponseTime: this.getAverageMetric('api_call'),
            totalApiCalls: apiMetrics.length,
            slowestApiCall: apiMetrics.length > 0 ? Math.max(...apiMetrics.map(m => m.value)) : 0,
            resourceCount: resourceMetrics.length,
            averageResourceLoadTime: this.getAverageMetric('resource_load'),
            memoryUsage: this.getAverageMetric('memory_usage'),
            totalMetrics: this.metrics.length
        };
    }

    // Send metric to analytics
    private sendToAnalytics(metric: PerformanceMetric) {
        // This would integrate with your analytics service
        // Example: Google Analytics, Mixpanel, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metric', {
                metric_name: metric.name,
                metric_value: metric.value,
                metric_category: metric.category,
                ...metric.metadata
            });
        }
    }

    // Get first paint time
    private getFirstPaint(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    // Get first contentful paint time
    private getFirstContentfulPaint(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    }

    // Clear all metrics
    clear() {
        this.metrics = [];
    }

    // Destroy monitor
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.metrics = [];
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance tracking decorator for functions
export function trackPerformance(name: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const start = performance.now();
            try {
                const result = await method.apply(this, args);
                const duration = performance.now() - start;
                performanceMonitor.trackEvent(`${name}_success`, duration);
                return result;
            } catch (error) {
                const duration = performance.now() - start;
                performanceMonitor.trackEvent(`${name}_error`, duration, { error: error.message });
                throw error;
            }
        };
    };
}

// Performance tracking for API calls
export function trackApiPerformance() {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const start = performance.now();
        const url = typeof args[0] === 'string' ? args[0].url : args[0].url;
        const method = args[1] || 'GET';
        try {
            const response = await originalFetch.apply(this, args);
            const duration = performance.now() - start;
            performanceMonitor.trackApiCall(url, method, duration, response.status);
            return response;
        } catch (error) {
            const duration = performance.now() - start;
            performanceMonitor.trackApiCall(url, method, duration, 0);
            throw error;
        }
    };
}

// Initialize performance tracking
if (typeof window !== undefined) {
    trackApiPerformance();
} 