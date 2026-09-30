// SLEEP_LAB Service Worker
// Enables offline functionality and caching

// Bump on every deploy that changes cached files so clients drop stale copies
const CACHE_NAME = 'sleeplab-v2';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // External CDN resources (cached on first use)
];

// External resources to cache when fetched (prefixes; includes Font Awesome webfonts)
const EXTERNAL_CACHE = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/'
];

function isCacheable(request, response) {
  if (!response) return false;
  if (response.status === 200) return true;
  // CDN <script>/<link> tags without crossorigin return opaque responses (status 0)
  return response.type === 'opaque' && EXTERNAL_CACHE.some(ext => request.url.startsWith(ext));
}

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Pages: network first, so a new deploy is seen on the first visit (cache = offline fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Fetch and update cache in background (stale-while-revalidate)
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (isCacheable(request, networkResponse)) {
                  const responseClone = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, responseClone));
                }
              })
              .catch(() => {}) // Ignore network errors during background update
          );
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Check if valid response
            if (!isCacheable(request, networkResponse)) {
              return networkResponse;
            }

            // Clone the response (can only be consumed once)
            const responseClone = networkResponse.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache same-origin and allowed external resources
                if (url.origin === location.origin ||
                    EXTERNAL_CACHE.some(ext => request.url.startsWith(ext))) {
                  cache.put(request, responseClone);
                }
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);

            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }

            // Return a simple error response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Time for your sleep routine!',
    icon: '/icons/IMG_7864.png',
    badge: '/icons/IMG_7864.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open SLEEP_LAB' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SLEEP_LAB', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (for future sleep diary syncing)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sleep-diary') {
    event.waitUntil(syncSleepDiary());
  }
});

async function syncSleepDiary() {
  // Future: sync offline sleep diary entries when back online
  console.log('[SW] Syncing sleep diary data...');
}

console.log('[SW] Service Worker loaded');
