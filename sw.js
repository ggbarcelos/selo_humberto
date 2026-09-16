const CACHE_NAME = 'selo-humberto-v24';

// Only same-origin files that make up the editor are precached. External
// links (social networks and the official site) are intentionally untouched.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/app.js?v=22',
  './src/styles.css',
  './img/pwa/icon-180.png',
  './img/pwa/icon-192.png',
  './img/pwa/icon-512.png',
  './img/pwa/icon-192-maskable.png',
  './img/pwa/icon-512-maskable.png',
  './img/image22.png',
  './img/logohumberto.png',
  './img/numero.png',
  './modelos/modelo1.png?v=22',
  './modelos/modelo2.png?v=22',
  './modelos/modelo3.png?v=22',
  './fonts/BebasNeue.woff2',
  './fonts/Hey-August.woff2',
  './fonts/NexaRustSans-Trial-Black2.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // The shell is atomic: a missing core asset must fail installation so a
      // broken offline app is never activated.
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('selo-humberto-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

function cacheResponse(request, response) {
  if (!response || !response.ok) return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => cacheResponse(request, response));
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  // Never intercept cross-origin requests. This keeps the service worker out
  // of external APIs, social links, analytics and share destinations.
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request));
});
