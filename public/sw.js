// sw.js
const CACHE_NAME = "dashboard-core-v2";
const DATA_CACHE = "dashboard-data-v1";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/icons/leaf_icon.png"
];

// Install event - cache core assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching core assets");
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DATA_CACHE) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for assets
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then(cached => {
            return cached || new Response(
              JSON.stringify({ error: "Offline and no cached data" }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  }
  // Static assets - cache first, fallback to network
  else {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          // Cache new assets
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
