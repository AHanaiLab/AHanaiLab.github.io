// Self-Destructing Service Worker to fix caching issues
const CACHE_NAME = 'ap-app-v177-KILL-SWITCH';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[SW] Kill Switch Installed');
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Kill Switch Activated. Clearing ALL caches...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[SW] Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Pass through all requests to network
self.addEventListener('fetch', (event) => {
    // console.log('[SW] Fetching from network:', event.request.url);
    event.respondWith(fetch(event.request));
});

