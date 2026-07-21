const CACHE_NAME = 'cyber-bg-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/index.css',
  '/assets/logo/logo.png',
  '/assets/characters/cyber_soldier.png',
  '/assets/characters/hacker.png',
  '/assets/characters/cyber_ninja.png',
  '/assets/characters/heavy_gunner.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always network-first for socket.io & API calls
  if (event.request.url.includes('/socket.io/') || event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
