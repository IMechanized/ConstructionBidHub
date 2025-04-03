// This is a special development-only service worker 
// to help with refreshing content during development

// Cache name for development mode
const CACHE_NAME = 'fcb-dev-cache-v1';

// Install event - sets up a minimal cache
self.addEventListener('install', (event) => {
  console.log('Development Service Worker: Installing');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Create a minimal cache for offline support
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/offline.html',
        '/'
      ]);
    })
  );
});

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
  console.log('Development Service Worker: Activating');
  
  // Delete old caches to ensure we don't serve stale content
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME;
        }).map((name) => {
          console.log('Development Service Worker: Clearing old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      // Claim clients to control all tabs immediately
      return self.clients.claim();
    })
  );
});

// Special development fetch handler - prioritize network for fresh content
self.addEventListener('fetch', (event) => {
  // For API requests and navigation, always go to network first
  // This ensures we get fresh content during development
  if (event.request.url.includes('/api/') || 
      event.request.mode === 'navigate') {
    
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback for offline support
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response(
            JSON.stringify({ error: 'Network error - offline' }), 
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }
  
  // For other resources, try network first then fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before using it
        const responseClone = response.clone();
        
        // Update the cache with the latest version
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Handle messages from clients (e.g., to trigger cache clearing)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Development Service Worker: Clearing caches on demand');
    
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('Development Service Worker: Clearing cache:', name);
            return caches.delete(name);
          })
        );
      })
    );
  }
});

console.log('Development Service Worker: Loaded');