/**
 * 🦈 Creditrack Engine - Service Worker
 * Gestão Soberana de Cache e Persistência para LojinhaBoy
 */

const CACHE_NAME = 'creditrack-engine-v3.0.2'; // 🆙 Atualize para invalidar caches antigos

// Ativos fundamentais para a soberania offline (Heurística #7)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Ícones e Identidade
  '/src/components/icons/fav-icon.svg',
  '/src/components/icons/icon-app.svg',
  '/src/components/icons/shark-dark.png',
  '/src/components/icons/shark-light.png',
  // Mascotes SVGs (Carregamento Instantâneo)
  '/src/components/icons/mascote-dash.svg',
  '/src/components/icons/mascote-ok.svg',
  '/src/components/icons/mascote-alerta.svg',
  '/src/components/icons/mascote-erro.svg',
  '/src/components/icons/mascote-cartao.svg',
  '/src/components/icons/mascote-data.svg',
  '/src/components/icons/mascote-notificacao.svg'
];

// 🟢 INSTALAÇÃO: Blindagem de ativos essenciais
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🦈 [SW] Engine instalada. Assets protegidos em cache.');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 🟢 ATIVAÇÃO: Purga de versões obsoletas (Heurística #5)
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

// 🟢 FETCH: O Coração da Operação
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🛡️ 1. FILTRO DE SEGURANÇA (Apenas GET e protocolos internos)
  if (
    !request.url.startsWith('http') ||
    url.pathname.includes('core.js') ||
    url.hostname.includes('extension') ||
    url.hostname.includes('paypal') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 📊 2. DADOS EM TEMPO REAL (Supabase: Nunca cachear dados financeiros)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // 🚀 3. NAVEGAÇÃO (HTML): Network-First (Garante a última versão do Creditrack)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
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

  // 🖼️ 4. ASSETS E MASCOTES: Cache-First (Performance extrema)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        // Cacheia novos assets dinamicamente se forem da nossa origem
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

// 🟢 BACKGROUND SYNC: Resiliência de dados
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-emprestimos') {
    console.log('🌐 [SW] Conexão detectada! Shark Engine iniciando sincronia...');
    // A lógica de sincronia é disparada no App via Broadcast ou Revalidação do React Query
  }
});