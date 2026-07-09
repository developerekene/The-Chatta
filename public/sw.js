const CACHE_NAME = 'chatta-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.jpg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Pre-caching during service worker installation failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Let Firebase / Firestore requests go straight to network
  if (url.includes('googleapis.com') || url.includes('firebase') || url.includes('firestore') || url.includes('auth')) {
    return;
  }

  // Handle only GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // If response is valid, cache it for static assets
          if (response && response.status === 200 && response.type === 'basic') {
            // Avoid caching large or non-static files
            if (!url.includes('/api/') && !url.includes('sockjs') && !url.includes('hmr')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return response;
        })
        .catch(() => {
          // If offline and request is document navigation, return index page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return null;
        });
    })
  );
});
