const CACHE_NAME = "eskola-kirola-app-diseinu-berria-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./images/icon.192.png",
  "./images/icon.512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return null;
        })
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

  // HTML/CSS/JS: lehenengo saretik saiatu, diseinu berria berehala hartzeko.
  if (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/style.css") ||
    url.pathname.endsWith("/app.js")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          const kopia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, kopia));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Gainerako fitxategiak: cache erabilgarria offline modurako.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request).then(response => {
          const kopia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, kopia));
          return response;
        });
      })
  );
});
