// Minimal service worker — caches the app shell for offline use
// Bump CACHE name on every release to force old caches to be deleted on activate.
const CACHE = "obgyn-tools-2026-05-15-v2";
const ASSETS = ["/", "/tools", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Skip cross-origin and Supabase API calls — those go straight to network so data is fresh.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) return;

  const isHTML = req.mode === "navigate" || req.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    // Network-first for HTML — guarantees latest app shell + latest JS bundle hashes.
    e.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // Stale-while-revalidate for hashed JS/CSS/images — fast load + background update.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

// Allow the app to trigger an immediate update.
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
