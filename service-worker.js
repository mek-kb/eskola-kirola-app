const CACHE_NAME = "kirolez-blai-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
  "./images/lh3-ordutegia.jpg",
  "./images/lh4-ordutegia.jpg",
  "./images/lh5-ordutegia.jpg",
  "./images/dbh-ordutegia.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
