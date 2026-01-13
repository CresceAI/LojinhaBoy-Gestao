// public/sw.js - PWA Offline-First
const CACHE_NAME = 'fintech-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/static/css/main.css',
  '/static/js/main.js'
];

// 🔴 Install - Cache essencial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 🔴 Activate - Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 🔴 Fetch - Offline + Cache-First
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ✅ Cache hit
        if (response) return response;
        
        // ✅ Network fallback
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // ✅ Cache network response
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          
          return networkResponse;
        });
      }).catch(() => {
        // ✅ Offline fallback
        return caches.match('/');
      })
  );
});

// 🔴 Background Sync (Supabase queue)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-supabase') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const pending = await indexedDB.databases();
  // Sync queue logic aqui
}
