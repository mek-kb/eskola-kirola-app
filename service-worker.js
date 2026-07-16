const CACHE_NAME = "eskola-kirola-2-1-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(name => name !== CACHE_NAME ? caches.delete(name) : null)
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Google Sheets eta kanpoko datuak ez cacheatu.
  if (url.hostname.includes("docs.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const kopia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, kopia));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
