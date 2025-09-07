const CACHE_NAME = 'taskpop-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : undefined)))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((network) => {
        const copy = network.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return network;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

