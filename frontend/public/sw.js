// sw.js — Service Worker for AksaraCAT PWA (Offline-First Cache)

const CACHE_NAME = 'aksaracat-pwa-v2';
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/bank_soal_cpns.json'
];

// Install Event: skip waiting immediately
self.addEventListener('install', event => {
  if (IS_DEV) {
    // In development: just activate immediately, don't cache anything
    console.log('[SW] Dev mode — skipping pre-cache, activating immediately.');
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching core assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Only handle HTTP/HTTPS schemes
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // In development: ALWAYS pass through to network, never use cache
  // This prevents SW from intercepting Vite HMR WebSocket or module requests
  if (IS_DEV) {
    return; // Let the browser handle it normally
  }

  // Production: Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          const acceptHeader = event.request.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
