// HNDY Enhanced Service Worker - Push Notifications + PWA Features
// File: public/service-worker.js

const CACHE_NAME = 'hndy-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing HNDY PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] HNDY PWA installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating HNDY PWA...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] HNDY PWA activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push notification handling (keeping your existing functionality)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.body || 'You have a new update from HNDY',
      icon: data.icon || '/logo192.png',
      badge: data.badge || '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/logo192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/favicon.ico'
        }
      ],
      requireInteraction: true,
      tag: data.data?.requestId || 'hndy-notification',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '🔧 HNDY Update', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('🔧 HNDY Update', {
        body: 'You have a new update from HNDY',
        icon: '/logo192.png',
        badge: '/favicon.ico'
      })
    );
  }
});

// Notification click handling (enhanced)
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get the URL from notification data or default to customer portal
  const urlToOpen = event.notification.data?.url || '/customer-portal';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(client.url.split('?')[0] + '?action=' + urlToOpen.replace('/', ''));
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin + urlToOpen);
        }
      })
  );
});

// Background sync (for offline form submissions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(
      // Handle offline submissions here
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  console.log('[Service Worker] Syncing offline data...');
  // Implementation would check IndexedDB for offline submissions
  // For now, just log that sync is available
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🚀 HNDY Enhanced Service Worker loaded with PWA + Push features');