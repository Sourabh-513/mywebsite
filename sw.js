// sw.js

// Define the version of the cache
const CACHE_VERSION = 'v1';

// Define the list of files to cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/sections.css',
  '/js/script.js',
  '/js/navigation.js',
  '/assets/images/logo.png',
  '/data/videos.json',
  '/data/spotify.json'
];

// Install the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// Activate the service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_VERSION) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Intercept network requests and serve cached content
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
