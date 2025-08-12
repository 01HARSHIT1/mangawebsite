interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    key?: string;
    useLocalStorage?: boolean;
}

class CacheManager {
    private memoryCache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 10; // 5 minutes
    private readonly MAX_CACHE_SIZE = 100;

    // Get cached data
    get<T>(key: string): T | null {
        // Try memory cache first
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && this.isValid(memoryEntry)) {
            return memoryEntry.data;
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (this.isValid(entry)) {
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    return entry.data;
                } else {
                    localStorage.removeItem(`cache_${key}`);
                }
            }
        } catch (error) {
            console.warn('Failed to read from localStorage cache:', error);
        }

        return null;
    }

    // Set cached data
    set<T>(key: string, data: T, options: CacheOptions = {}): void {
        const ttl = options.ttl || this.DEFAULT_TTL;
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };

        // Store in memory cache
        this.memoryCache.set(key, entry);

        // Store in localStorage if enabled
        if (options.useLocalStorage !== false) {
            try {
                localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
            } catch (error) {
                console.warn('Failed to write to localStorage cache:', error);
            }
        }

        // Clean up if cache is too large
        this.cleanup();
    }

    // Check if cache entry is still valid
    private isValid(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    // Remove specific cache entry
    delete(key: string): void {
        this.memoryCache.delete(key);
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (error) {
            console.warn('Failed to remove from localStorage cache:', error);
        }
    }

    // Clear all cache
    clear(): void {
        this.memoryCache.clear();
        try {
            // Remove all cache keys from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }

    // Clean up expired entries
    private cleanup(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        // Find expired entries
        this.memoryCache.forEach((entry, key) => {
            if (!this.isValid(entry)) {
                expiredKeys.push(key);
            }
        });

        // Remove expired entries
        expiredKeys.forEach(key => this.memoryCache.delete(key));

        // If still too large, remove oldest entries
        if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
            const entries = Array.from(this.memoryCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, this.memoryCache.size - this.MAX_CACHE_SIZE);
            toRemove.forEach(([key]) => this.memoryCache.delete(key));
        }
    }

    // Get cache statistics
    getStats() {
        return {
            memorySize: this.memoryCache.size,
            maxSize: this.MAX_CACHE_SIZE,
            memoryKeys: Array.from(this.memoryCache.keys())
        };
    }
}

// Global cache instance
export const cache = new CacheManager();

// Cached fetch function
export async function cachedFetch<T>(
    url: string,
    options: RequestInit & CacheOptions = {}
): Promise<T> {
    const { ttl, key, useLocalStorage, ...fetchOptions } = options;
    const cacheKey = key || `${url}_${JSON.stringify(fetchOptions)}`;

    // Try to get from cache first
    const cached = cache.get<T>(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from network
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    cache.set(cacheKey, data, { ttl, useLocalStorage });

    return data;
}

// Cache invalidation helpers
export const cacheKeys = {
    manga: (id?: string) => id ? `manga_${id}` : 'manga_list',
    user: (id?: string) => id ? `user_${id}` : 'user_profile',
    recommendations: (type: string) => `recommendations_${type}`,
    search: (query: string) => `search_${query}`,
    comments: (mangaId: string) => `comments_${mangaId}`,
    chapters: (mangaId: string) => `chapters_${mangaId}`
};

// Invalidate related cache entries
export function invalidateCache(pattern: string): void {
    const stats = cache.getStats();
    stats.memoryKeys.forEach(key => {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    });
}

// Preload critical data
export async function preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
        '/api/manga?limit=20',
        '/api/manga/recommendations/trending'
    ];

    try {
        await Promise.allSettled(
            criticalEndpoints.map(endpoint =>
                cachedFetch(endpoint, { ttl: 10 * 60000 }) // 10 minutes
            )
        );
    } catch (error) {
        console.warn('Failed to preload critical data:', error);
    }
} 