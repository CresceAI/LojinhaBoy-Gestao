// public/sw.js
const CACHE_NAME = 'lojinhaboy-pro-v2.0.9'; // 🆙 Atualize a versão a cada deploy
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 🟢 Instalação: Cacheia o essencial e pula espera
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 🟢 Ativação: Limpa versões obsoletas para evitar conflitos na Vercel
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 🟢 Fetch: O coração do PWA
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🛡️ 1. FILTRO DE BLINDAGEM
  if (
    !request.url.startsWith('http') ||
    url.pathname.includes('core.js') ||
    url.href.includes('extension') ||
    url.hostname.includes('paypal') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 📊 2. DADOS EM TEMPO REAL (Supabase)
  if (request.url.includes('supabase.co')) {
    return;
  }

  // 🚀 3. ESTRATÉGIA PARA NAVEGAÇÃO (Rede-Primeiro)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a rede estiver OK, devolve e atualiza o cache do HTML
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', copy.clone());
            cache.put('/index.html', copy);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 🖼️ 4. ESTRATÉGIA PARA ASSETS (Cache-First com atualização em background)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

// 🟢 Sincronização em Segundo Plano (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-emprestimos') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  console.log('🌐 Conexão restaurada! Sincronizando dados pendentes...');
}
