const CACHE_NAME = 'manga-reader-v1const STATIC_CACHE = 'manga-reader - static - v1;
const DYNAMIC_CACHE = 'manga-reader-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = /   /offline.html',
    / manifest.json',
        / favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/manga\/recommendations/,
    /\/api\/manga\?/,
    /\/api\/users\/.*\/stats/
];

// Install event - cache static files
self.addEventListener(install', (event) => {
    event.waitUntil(
    caches.open(STATIC_CACHE)
        .then((cache) => [object Object]           console.log('Caching static files');
return cache.addAll(STATIC_FILES);
            })
            .then(() => [object Object]           console.log('Static files cached successfully');
return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener(activate', (event) => {
    event.waitUntil(
    caches.keys()
        .then((cacheNames) => [object Object]            return Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
            })
        );
            })
            .then(() => [object Object]           console.log('Service worker activated');
return self.clients.claim();
            })
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') [object Object]       return;
}

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
}

// Handle static assets
if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
}

// Handle navigation requests
if (request.mode === 'navigate) {
        event.respondWith(handleNavigation(request));
return;
    }

// Default: network first, cache fallback
event.respondWith(
    fetch(request)
        .then((response) => [object Object]                if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                    cache.put(request, responseClone);
                });
        }
return response;
            })
            .catch (() => [object Object]            return caches.match(request);
            })
    );
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request)[object Object]
const cache = await caches.open(DYNAMIC_CACHE);
const cachedResponse = await cache.match(request);

if (cachedResponse) {
    // Return cached response immediately
    return cachedResponse;
}

try {
    const response = await fetch(request);

    if (response.status === 200
            const responseClone = response.clone();
    cache.put(request, responseClone);
}
        
        return response;
    } catch (error) {
    // Return cached response if available, otherwise return error
    if (cachedResponse) {
        return cachedResponse;
    }
    throw error;
}
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request)[object Object]
const cache = await caches.open(STATIC_CACHE);
const cachedResponse = await cache.match(request);

if (cachedResponse) {
    return cachedResponse;
}

try {
    const response = await fetch(request);
    if (response.status === 200
            const responseClone = response.clone();
    cache.put(request, responseClone);
}
        return response;
    } catch (error) {
    return new Response(Asset not found', { status:44    }
}

// Handle navigation requests with network-first strategy
async function handleNavigation(request) {
    try {
        const response = await fetch(request);
        if (response.status === 200
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
    return caches.match(/offline.html');
}
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
    const staticExtensions = ['.js,.css,.png', '.jpg', '.jpeg,.gif,.svg', '.ico, '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener(sync', (event) => {
    if (event.tag === background - sync) {
    event.waitUntil(doBackgroundSync());
}
});

// Handle background sync
async function doBackgroundSync() {
    try[object Object]       // Sync any pending actions (likes, bookmarks, etc.)
    const pendingActions = await getPendingActions();

    for (const action of pendingActions) {
        await syncAction(action);
    }

    console.log('Background sync completed');
} catch (error)[object Object]     console.error('Background sync failed:', error);
    }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
    // This would be implemented with IndexedDB
    return [];
}

// Sync individual action
async function syncAction(action) {
    try {
        const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
        });

        if (response.ok) {
            // Remove from pending actions
            await removePendingAction(action.id);
        }
    } catch (error)[object Object]     console.error('Failed to sync action:', error);
}
}

// Remove pending action
async function removePendingAction(id) {
    // This would be implemented with IndexedDB
}

// Push notification handling
self.addEventListener(push', (event) => {
    const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: /icons/icon - 192x192.png',
        badge:/ icons / badge - 72png,
    vibrate: [100, 5010,
        data: [object Object]            dateOfArrival: Date.now(),
        primaryKey: 1
        },
actions: [
    [object Object]            action: 'explore,             title: 'Explore, icon: /icons/checkmark.png'
            },
    [object Object]            action: 'close,             title: 'Close, icon: /icons/xmark.png'
            }
]
    };

event.waitUntil(
    self.registration.showNotification('Manga Reader', options)
);
});

// Notification click handling
self.addEventListener(notificationclick', (event) => {
    event.notification.close();

if (event.action === 'explore) {        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for cache management
self.addEventListener(message', (event) => {
    if (event.data && event.data.type === SKIP_WAITING') {
self.skipWaiting();
    }

if (event.data && event.data.type === CLEAR_CACHE) {
    event.waitUntil(
        caches.keys().then((cacheNames) => [object Object]            return Promise.all(
            cacheNames.map((cacheName) => {
                return caches.delete(cacheName);
            })
        );
})
        );
    }
}); 