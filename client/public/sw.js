// Update this version number whenever you deploy changes
const VERSION = '1.3.0';
const CACHE_NAME = `findconstructionbids-v${VERSION}`;
const STATIC_CACHE_NAME = `findconstructionbids-static-v${VERSION}`;
const DATA_CACHE_NAME = `findconstructionbids-data-v${VERSION}`;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

console.log(`Service Worker: File loaded (version ${VERSION})`);

// Helper function to check if a request is an API request
const isApiRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
};

// Helper function to check if a request is for a third-party resource that should not be intercepted
const isThirdPartyResource = (request) => {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Don't intercept requests to these third-party services
  const thirdPartyDomains = [
    'stripe.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
    'amazonaws.com',
    'cloudinary.com'
  ];
  
  return thirdPartyDomains.some(domain => hostname.includes(domain));
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
  // Skip non-GET requests - let them go directly to the network
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't intercept third-party resources (Stripe, Google Maps, AWS S3, etc.)
  if (isThirdPartyResource(event.request)) {
    return;
  }

  // NEVER cache or intercept API requests - always go to network
  // This prevents issues with cached auth responses
  if (isApiRequest(event.request)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    // Network-first for HTML navigation to prevent blank screens with stale cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch((error) => {
          console.log('Service Worker: Navigation fetch failed, falling back to cache', error);
          
          // Try to return cached HTML
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Last resort: return offline page
              return caches.match('/offline.html');
            });
        })
    );
  } else {
    // Cache first for static assets (JS, CSS, images, etc.)
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
              
              // For images, return a placeholder
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
  console.log(`Service Worker: Activating (version ${VERSION})`);
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME, DATA_CACHE_NAME];
  
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
      // Take control of all clients immediately
      self.clients.claim()
    ])
    .then(() => {
      // Notify all clients that the service worker has been updated
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: VERSION
          });
        });
      });
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

console.log(`Service Worker: Script loaded (version ${VERSION})`);