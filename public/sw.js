const CACHE_NAME = 'manga-reader-v1';
const STATIC_CACHE = 'manga-reader-static-v1';
const DYNAMIC_CACHE = 'manga-reader-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/offline.html',
    '/manifest.json'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    '/api/manga',
    '/api/chapters'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip caching for API requests to prevent stale data
    if (url.pathname.startsWith('/api/')) {
        console.log('🔄 API request - skipping cache:', url.pathname);
        event.respondWith(fetch(request));
        return;
    }

    // Handle static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticAsset(request));
        return;
    }

    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
        return;
    }

    // Default: network first, cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        if (response.status === 200) {
            const responseClone = response.clone();
            cache.put(request, responseClone);
        }
        return response;
    } catch (error) {
        return new Response('Asset not found', { status: 404 });
    }
}

// Handle navigation requests with network-first strategy
async function handleNavigation(request) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            const responseClone = response.clone();
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, responseClone);
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page
        return caches.match('/offline.html');
    }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Handle background sync
async function doBackgroundSync() {
    try {
        // Sync any pending actions (likes, bookmarks, etc.)
        const pendingActions = await getPendingActions();

        for (const action of pendingActions) {
            await syncAction(action);
        }

        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
    // This would typically interact with IndexedDB
    // For now, return empty array
    return [];
}

// Sync a single action
async function syncAction(action) {
    try {
        // This would typically make an API call to sync the action
        console.log('Syncing action:', action);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Action synced successfully:', action);
    } catch (error) {
        console.error('Failed to sync action:', action, error);
        throw error;
    }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
        })
    );
}

// Handle push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/icon-192x192.png',
            data: data.data || {},
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
            tag: data.tag || 'default'
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action) {
        // Handle specific action clicks
        console.log('Notification action clicked:', event.action);
    } else {
        // Default click behavior
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification);
});

// Handle background fetch
self.addEventListener('backgroundfetchsuccess', (event) => {
    console.log('Background fetch succeeded:', event.registration.id);

    event.waitUntil(
        (async () => {
            const registration = event.registration;
            const records = await registration.matchAll();

            for (const record of records) {
                const response = await record.responseReady;
                const cache = await caches.open('background-fetch');
                await cache.put(record.request, response);
            }
        })()
    );
});

// Handle background fetch failure
self.addEventListener('backgroundfetchfail', (event) => {
    console.log('Background fetch failed:', event.registration.id);
});

// Handle background fetch abort
self.addEventListener('backgroundfetchabort', (event) => {
    console.log('Background fetch aborted:', event.registration.id);
});

// Handle periodicsync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

// Sync content periodically
async function syncContent() {
    try {
        console.log('Periodic content sync started');

        // This would typically sync content like new chapters, updates, etc.
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Periodic content sync completed');
    } catch (error) {
        console.error('Periodic content sync failed:', error);
    }
} 