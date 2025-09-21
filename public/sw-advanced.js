// Advanced Service Worker for Manga Website PWA
// Provides offline reading, caching, and background sync

const CACHE_NAME = 'manga-reader-v2.0.0';
const DYNAMIC_CACHE = 'manga-dynamic-v2.0.0';
const IMAGE_CACHE = 'manga-images-v2.0.0';
const API_CACHE = 'manga-api-v2.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/manga',
    '/genres',
    '/search',
    '/login',
    '/signup',
    '/manifest.json',
    '/favicon.ico',
    // Add your critical CSS and JS files here
];

// API endpoints to cache
const CACHEABLE_APIS = [
    '/api/manga',
    '/api/genres',
    '/api/featured'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== IMAGE_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
    } else if (url.pathname.includes('/manga-images/') || url.pathname.includes('/manga-covers/')) {
        event.respondWith(handleImageRequest(request));
    } else if (url.pathname.startsWith('/manga/') && url.pathname.includes('/chapter/')) {
        event.respondWith(handleChapterRequest(request));
    } else {
        event.respondWith(handlePageRequest(request));
    }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        // Fallback to cache
        console.log('📡 Network failed, trying cache for:', url.pathname);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('📦 Serving from cache:', url.pathname);
            return cachedResponse;
        }
        
        // Return offline fallback for manga API
        if (url.pathname.includes('/api/manga')) {
            return new Response(JSON.stringify({
                manga: [],
                message: 'Offline mode - limited content available',
                offline: true
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        throw error;
    }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('🖼️ Serving image from cache');
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Image fetch failed');
    } catch (error) {
        console.log('🖼️ Image fetch failed, serving placeholder');
        // Return placeholder image for offline mode
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#374151"/><text x="100" y="150" text-anchor="middle" fill="white" font-family="Arial">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
}

// Handle chapter/manga pages with stale-while-revalidate
async function handleChapterRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Return cached version immediately if available
    if (cachedResponse) {
        console.log('📖 Serving chapter from cache');
        // Update cache in background
        fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response);
            }
        }).catch(() => {});
        
        return cachedResponse;
    }
    
    // If not cached, try network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Chapter fetch failed');
    } catch (error) {
        // Return offline chapter page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - MangaReader</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif; 
                        background: linear-gradient(135deg, #0f172a, #581c87);
                        color: white;
                        text-align: center;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .offline-title { font-size: 2rem; margin-bottom: 1rem; }
                    .offline-message { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }
                    .retry-button { 
                        background: linear-gradient(45deg, #8b5cf6, #ec4899);
                        border: none;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    .retry-button:hover { transform: scale(1.05); }
                </style>
            </head>
            <body>
                <div class="offline-icon">📖</div>
                <h1 class="offline-title">Chapter Offline</h1>
                <p class="offline-message">This chapter is not available offline.<br>Please check your internet connection and try again.</p>
                <button class="retry-button" onclick="window.location.reload()">Retry</button>
                <br><br>
                <a href="/" style="color: #8b5cf6; text-decoration: none;">← Back to Homepage</a>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Handle regular page requests
async function handlePageRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const dynamicCache = await caches.open(DYNAMIC_CACHE);
            dynamicCache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Page fetch failed');
    } catch (error) {
        // Return offline page
        const offlinePage = await cache.match('/');
        if (offlinePage) {
            return offlinePage;
        }
        
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - MangaReader</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif; 
                        background: linear-gradient(135deg, #0f172a, #581c87);
                        color: white;
                        text-align: center;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                </style>
            </head>
            <body>
                <h1>📱 MangaReader</h1>
                <p>You're offline! Some features may not be available.</p>
                <button onclick="window.location.reload()">Try Again</button>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-comments') {
        event.waitUntil(syncOfflineComments());
    } else if (event.tag === 'background-sync-bookmarks') {
        event.waitUntil(syncOfflineBookmarks());
    } else if (event.tag === 'background-sync-reading-progress') {
        event.waitUntil(syncReadingProgress());
    }
});

// Sync offline comments when back online
async function syncOfflineComments() {
    try {
        const offlineComments = await getStoredData('offline-comments');
        
        for (const comment of offlineComments) {
            try {
                await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': comment.token
                    },
                    body: JSON.stringify(comment.data)
                });
                
                // Remove from offline storage after successful sync
                await removeStoredData('offline-comments', comment.id);
            } catch (error) {
                console.error('Failed to sync comment:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Sync offline bookmarks
async function syncOfflineBookmarks() {
    try {
        const offlineBookmarks = await getStoredData('offline-bookmarks');
        
        for (const bookmark of offlineBookmarks) {
            try {
                await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': bookmark.token
                    },
                    body: JSON.stringify(bookmark.data)
                });
                
                await removeStoredData('offline-bookmarks', bookmark.id);
            } catch (error) {
                console.error('Failed to sync bookmark:', error);
            }
        }
    } catch (error) {
        console.error('Background bookmark sync failed:', error);
    }
}

// Sync reading progress
async function syncReadingProgress() {
    try {
        const offlineProgress = await getStoredData('offline-reading-progress');
        
        for (const progress of offlineProgress) {
            try {
                await fetch('/api/reading-progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': progress.token
                    },
                    body: JSON.stringify(progress.data)
                });
                
                await removeStoredData('offline-reading-progress', progress.id);
            } catch (error) {
                console.error('Failed to sync reading progress:', error);
            }
        }
    } catch (error) {
        console.error('Background reading progress sync failed:', error);
    }
}

// Helper functions for IndexedDB operations
async function getStoredData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MangaReaderOffline', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result || []);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function removeStoredData(storeName, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MangaReaderOffline', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => {
                resolve(true);
            };
            
            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('🔔 Push notification received');
    
    let notificationData = {};
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (error) {
            notificationData = {
                title: 'MangaReader',
                body: event.data.text() || 'New notification',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png'
            };
        }
    }

    const options = {
        title: notificationData.title || 'MangaReader',
        body: notificationData.body || 'You have a new notification',
        icon: notificationData.icon || '/icons/icon-192x192.png',
        badge: notificationData.badge || '/icons/icon-72x72.png',
        data: notificationData.data || {},
        tag: notificationData.tag || 'general',
        requireInteraction: notificationData.requireInteraction || false,
        actions: notificationData.actions || [
            {
                action: 'open',
                title: 'Open',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'close') {
        return;
    }
    
    // Determine URL to open
    let urlToOpen = '/';
    
    if (data.mangaId && data.chapterId) {
        urlToOpen = `/manga/${data.mangaId}/chapter/${data.chapterId}`;
    } else if (data.mangaId) {
        urlToOpen = `/manga/${data.mangaId}`;
    } else if (data.url) {
        urlToOpen = data.url;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window/tab open
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window/tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Periodic background sync for offline content
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncOfflineContent());
    }
});

// Sync offline content in background
async function syncOfflineContent() {
    try {
        console.log('🔄 Background content sync started');
        
        // Sync offline reading progress
        await syncReadingProgress();
        
        // Sync offline comments
        await syncOfflineComments();
        
        // Sync offline bookmarks
        await syncOfflineBookmarks();
        
        // Preload popular manga for offline reading
        await preloadPopularManga();
        
        console.log('✅ Background content sync completed');
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// Preload popular manga for offline reading
async function preloadPopularManga() {
    try {
        const response = await fetch('/api/manga?sort=popular&limit=10');
        const data = await response.json();
        
        if (data.manga) {
            const imageCache = await caches.open(IMAGE_CACHE);
            
            // Cache cover images
            for (const manga of data.manga) {
                if (manga.coverImage) {
                    try {
                        await imageCache.add(manga.coverImage);
                    } catch (error) {
                        console.log('Failed to cache cover:', manga.coverImage);
                    }
                }
            }
        }
    } catch (error) {
        console.log('Failed to preload popular manga:', error);
    }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    const { action, data } = event.data;
    
    switch (action) {
        case 'CACHE_MANGA':
            event.waitUntil(cacheMangaForOffline(data));
            break;
        case 'CLEAR_CACHE':
            event.waitUntil(clearAllCaches());
            break;
        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ cacheSize: size });
            }));
            break;
    }
});

// Cache specific manga for offline reading
async function cacheMangaForOffline(mangaData) {
    try {
        const { mangaId, chapters } = mangaData;
        const imageCache = await caches.open(IMAGE_CACHE);
        const apiCache = await caches.open(API_CACHE);
        
        // Cache manga API data
        await apiCache.put(`/api/manga/${mangaId}`, new Response(JSON.stringify(mangaData)));
        
        // Cache chapter images
        for (const chapter of chapters) {
            if (chapter.pages) {
                for (const page of chapter.pages) {
                    try {
                        await imageCache.add(page);
                    } catch (error) {
                        console.log('Failed to cache page:', page);
                    }
                }
            }
        }
        
        console.log(`✅ Cached manga ${mangaId} for offline reading`);
    } catch (error) {
        console.error('Failed to cache manga for offline:', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🗑️ All caches cleared');
}

// Get total cache size
async function getCacheSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
    }
    return 0;
}

console.log('🚀 Advanced Service Worker loaded for MangaReader PWA');
