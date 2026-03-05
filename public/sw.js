// public/sw.js
const CACHE_NAME = "codeelysium-offline-v1";
const PRECACHE_URLS = [
  "/offline.html",
  "/offline-content/index.json",
  "/offline-content/lessons/steam-1-energy.json",
  "/offline-content/lessons/steam-2-fractions.json",
  "/offline-content/assets/energy.svg",
  "/offline-content/assets/fractions.svg"
];

// install: pre-cache minimal offline assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch((err) => {
      console.warn("sw precache failed", err);
    }))
  );
});

// activate: clean up older caches if needed
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch: serve offline-content from cache OR network, cache on the fly
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1) If request is to our offline-content folder, try cache-first then network and cache.
  if (url.pathname.startsWith("/offline-content")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          // cache a copy for future offline
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        }).catch(() => {
          // fallback to index or generic fallback
          return caches.match("/offline-content/index.json");
        });
      })
    );
    return;
  }

  // 2) Navigation fallback to offline.html when offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // 3) Default: try network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
