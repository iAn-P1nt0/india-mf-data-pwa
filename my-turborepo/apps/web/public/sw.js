const CACHE_NAME = "mf-data-shell-v1";
const PRECACHE_URLS = ["/", "/manifest.webmanifest"]; // Shell + manifest

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "prefetch") {
    return;
  }

  const urls = Array.isArray(event.data.payload)
    ? event.data.payload
    : event.data.url
      ? [event.data.url]
      : [];

  if (!urls.length) {
    return;
  }

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url, { mode: "cors" });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (error) {
            console.warn("SW prefetch failed", url, error);
          }
        })
      );
    })()
  );
});
