const CACHE_NAME = 'findconstructionbids-v2';
const STATIC_CACHE_NAME = 'findconstructionbids-static-v2';
const DATA_CACHE_NAME = 'findconstructionbids-data-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

console.log('Service Worker: File loaded');

// Helper function to check if a request is an API request
const isApiRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
};

// Helper function to check if the user is online
const isOnline = () => {
  return self.navigator && self.navigator.onLine;
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (request) => {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => asset === url.pathname);
};

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Create data cache
      caches.open(DATA_CACHE_NAME)
    ])
    .then(() => {
      console.log('Service Worker: All files cached');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('Service Worker: Cache failed:', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Different strategies for API requests vs static assets
  if (isApiRequest(event.request)) {
    // Network first, falling back to cached data for API requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response for offline use
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch((error) => {
          console.log('Service Worker: API fetch failed, falling back to cache', error);
          
          return caches.match(event.request)
            .then((cachedResponse) => {
              // If we have a cached response, return it
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If no cached data and offline, return a custom offline response for API
              return new Response(
                JSON.stringify({ 
                  error: 'You are offline',
                  offline: true,
                  timestamp: new Date().toISOString()
                }),
                { 
                  headers: { 'Content-Type': 'application/json' },
                  status: 503,
                  statusText: 'Service Unavailable'
                }
              );
            });
        })
    );
  } else {
    // Cache first, falling back to network for static assets and non-API requests
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise try to fetch from network
          return fetch(event.request)
            .then((response) => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                // For navigation requests, show offline page if network failed
                if (event.request.mode === 'navigate' && !isOnline()) {
                  return caches.match('/offline.html');
                }
                return response;
              }
              
              // Clone the response as it can only be consumed once
              const responseToCache = response.clone();
              
              // Add the response to cache for future use
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch((error) => {
              console.error('Service Worker: Fetch failed:', error);
              
              // For navigation requests, return offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
              
              // For static assets, return a placeholder if available
              // (e.g., placeholder image)
              if (event.request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#999">Offline</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              
              throw error;
            });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME, DATA_CACHE_NAME];
  
  // Take control immediately without waiting for reload
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

console.log('Service Worker: Script loaded');