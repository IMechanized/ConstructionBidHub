// Development service worker - does minimal caching to allow hot reloading
const DEV_CACHE_NAME = 'findconstructionbids-dev-cache';

// Minimal installation that won't interfere with dev server
self.addEventListener('install', (event) => {
  console.log('DEV Service Worker: Installing');
  // Skip waiting to take control immediately
  event.waitUntil(self.skipWaiting());
});

// Bypass cache for most requests in development to ensure hot reload works
self.addEventListener('fetch', (event) => {
  // For API requests, don't cache in development
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For everything else, network first with minimal caching
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error('DEV Service Worker: Fetch failed:', error);
        return caches.match(event.request);
      })
  );
});

// When activated, clear any old caches
self.addEventListener('activate', (event) => {
  console.log('DEV Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== DEV_CACHE_NAME) {
            console.log('DEV Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Log that the service worker is loaded
console.log('DEV Service Worker: Script loaded');