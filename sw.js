/* =======================================================================
   Finders Keypress - service worker
   Caches the app shell so the lab works fully offline and is installable.
   Strategy: cache-first for the known shell, with a network fallback that
   fills the cache for anything else (same-origin GET only).
   Bump CACHE_VERSION whenever shell files change to invalidate old caches.
   ======================================================================= */

const CACHE_VERSION = 'fk-v1';
const SHELL = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './vendor/chart.umd.min.js',
    './site.webmanifest',
    './assets/favicon.svg',
    './assets/favicon-32.png',
    './assets/apple-touch-icon.png',
    './assets/icon-512.png',
    './assets/og-image.png'
];

// Pre-cache the shell on install.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

// Clean up old caches on activate.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

// Cache-first with network fallback (same-origin GET only).
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req)
                .then((res) => {
                    // Cache a copy of successful responses for next time.
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
        })
    );
});
