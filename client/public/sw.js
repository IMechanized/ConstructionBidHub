// Update this version number whenever you deploy changes
const VERSION = '2.1.0';
const CACHE_NAME = `findconstructionbids-v${VERSION}`;
const STATIC_CACHE_NAME = `findconstructionbids-static-v${VERSION}`;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

console.log(`Service Worker: File loaded (version ${VERSION})`);

const isApiRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
};

const isThirdPartyResource = (request) => {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  const thirdPartyDomains = [
    'stripe.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
    'amazonaws.com',
    'cloudinary.com',
    'googletagmanager.com',
    'google-analytics.com'
  ];
  
  return thirdPartyDomains.some(domain => hostname.includes(domain));
};

const isVersionedAsset = (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  return /\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot)$/i.test(pathname) ||
         /assets\/.*\.[a-f0-9]{8,}\./i.test(pathname);
};

const isHtmlRequest = (request) => {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  return request.mode === 'navigate' || 
         accept.includes('text/html') ||
         url.pathname === '/' ||
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
};

self.addEventListener('install', (event) => {
  console.log(`Service Worker: Installing version ${VERSION}`);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting to activate immediately');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`Service Worker: Activating (version ${VERSION})`);
  
  const currentCaches = [CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('findconstructionbids-') && !currentCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Taking control of all clients');
        return self.clients.claim();
      })
      .then(() => {
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION
          });
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (isThirdPartyResource(event.request)) {
    return;
  }

  if (isApiRequest(event.request)) {
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
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
          console.log('Service Worker: Navigation fetch failed', error);
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/').then(root => root || caches.match('/offline.html'));
            });
        })
    );
    return;
  }

  if (isVersionedAsset(event.request)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
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
              console.error('Service Worker: Failed to fetch versioned asset:', event.request.url);
              throw error;
            });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            if (event.request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#999">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            throw new Error('No cached response available');
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Service Worker: Clearing all caches');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
  
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    console.log('Service Worker: Force refreshing all clients');
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'FORCE_RELOAD' });
      });
    });
  }
});

console.log(`Service Worker: Script loaded (version ${VERSION})`);