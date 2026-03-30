// This name helps you clear the cache later if you update your app
const CACHE_NAME = 'biz-tracker-v1';

// Files to store on the phone for "Offline" or "Fast Load" mode
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install the Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Help the app load from the cache if the internet is slow
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});