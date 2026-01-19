const CACHE_NAME = 'haraz-invoice-v7';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './logo_cinv.png',
  './manifest.json',
  './bg.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.error('Failed to cache assets:', err);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
