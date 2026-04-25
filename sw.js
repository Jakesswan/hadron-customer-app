/*
 * Hadron Group — Customer Interface service worker
 *
 * Strategy
 *  - Precache the app shell on install so the app launches offline.
 *  - For navigation requests (HTML): network-first, fall back to cached index.html.
 *  - For same-origin static assets: cache-first with background revalidation.
 *  - Never cache third-party requests (Chatbase, analytics, etc.) — let the network handle them.
 *
 * Bump CACHE_VERSION whenever you ship a change so phones pick it up on next launch.
 */

const CACHE_VERSION = 'hadron-v18';
const APP_SHELL = [
  './',
  './index.html',
  './i18n.js',
  './lims.js',
  './qr.js',
  './qr-app.js',
  './pool.js',
  './Hadron_Logo.png',
  './Hadron_Logo_dark.png',
  './LabCom_Logo.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Never intercept cross-origin requests (Chatbase, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to cached index.html so the app launches offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache-first with background refresh
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
