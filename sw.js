const CACHE_NAME = 'spotify-lite-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/api.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('pipedapi')) return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
