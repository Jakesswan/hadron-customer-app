/*
 * Hadron Group — Customer Interface service worker
 *
 * Strategy
 *  - Precache the app shell on install so the app launches offline.
 *  - For navigation requests (HTML): network-first, fall back to cached index.html.
 *  - For same-origin static assets: cache-first with background revalidation.
 *  - Never cache third-party requests (Supabase, Chatbase, analytics, etc.)
 *  - Receive Web Push events and surface them as system notifications.
 *  - On notification click, focus an open client or open the deep link.
 *
 * Bump CACHE_VERSION whenever you ship a change so phones pick it up on next launch.
 */

const CACHE_VERSION = 'hadron-v153';
const APP_SHELL = [
  './',
  './index.html',
  './supabase-js-2.117.2.js?v=153',
  './i18n.js?v=153',
  './lims.js?v=153',
  './qr.js?v=153',
  './qr-app.js?v=153',
  './pool.js?v=153',
  './coolingtower.js?v=153',
  './boiler.js?v=153',
  './softener.js?v=153',
  './academy.js?v=153',
  './academy-content.js?v=153',
  './supabase-client.js?v=153',
  './hg-ui.js?v=153',
  './auth-ui.js?v=153',
  './push.js?v=153',
  './lims-sync.js?v=153',
  './portal.js?v=153',
  './team.js?v=153',
  './searchable-select.js?v=153',
  './trends.js?v=153',
  './emoji.js?v=153',
  './hadron-icons.js?v=153',
  './customize.js?v=153',
  './data-manager.js?v=153',
  './jar-test.html',
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

// A page load that takes longer than this opens the app from the cache instead (see fetch below).
const NAV_TIMEOUT_MS = 4000;

// Optional enhancement libs — precached BEST-EFFORT (allSettled), separate from the
// atomic APP_SHELL, so a single missing/failed one can never fail the whole app-shell
// install. Each of these has a CDN fallback at runtime, so a miss only costs offline use.
const OPTIONAL_CACHE = [
  './html5-qrcode.min.js'   // offline QR scanning (falls back to cdnjs when not cached)
];

// cache: 'reload' bypasses the browser's HTTP cache (GitHub Pages serves max-age=600), so a new
// version can't precache a stale copy of a file fetched in the last ten minutes.
const fresh = (u) => new Request(u, { cache: 'reload' });
// The precached page IS the offline copy, so it must be THIS version's page: a CDN edge still serving
// the previous page, or a deploy landing mid-install, would leave a page asking for ?v= scripts this
// cache doesn't have (dead offline). Then the install is refused and its cache removed; the current
// version keeps working and the next launch tries again.
const VERSION_TAG = '.js?v=' + CACHE_VERSION.replace('hadron-v', '') + '"';
const pageIsThisVersion = (cache, u) =>
  cache.match(u).then((r) => r.text()).then((t) => {
    if (!t.includes(VERSION_TAG)) throw new Error('precached ' + u + ' is not ' + CACHE_VERSION);
  });
self.addEventListener('install', (event) => {
  event.waitUntil(
    // Only a cache THIS install created is removed on failure: if a same-version worker is being
    // re-installed (sw.js changed without a version bump), its cache is the live offline copy.
    caches.has(CACHE_VERSION).then((existed) => caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL.map(fresh))
        .then(() => Promise.all(['./', './index.html'].map((u) => pageIsThisVersion(cache, u))))
        .catch((e) => (existed ? Promise.resolve() : caches.delete(CACHE_VERSION)).then(() => { throw e; }))
        .then(() => Promise.allSettled(OPTIONAL_CACHE.map((u) => cache.add(fresh(u)))))
    ))
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

  // Never intercept cross-origin requests (Supabase, Chatbase, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so a new version shows up straight away. A navigation response is
  // NEVER cached: the offline copy is the page precached with THIS version's scripts. (A newer
  // version's page cached here would ask for ?v= scripts this version doesn't have, and the app
  // would be dead offline until the next connection.) Also:
  //  - on a barely-working connection the app opens from the cache after NAV_TIMEOUT_MS;
  //  - offline, on a server error, or on a 404 for the app itself (mid-deploy) the cached page is
  //    used; an embedded page such as jar-test.html?embed=1 finds its own precached copy;
  //  - only the app's own URL falls back to the app (another page, e.g. privacy.html, never does).
  if (req.mode === 'navigate') {
    const scope = new URL(self.registration.scope).pathname;
    const isApp = url.pathname === scope || url.pathname === scope + 'index.html';
    const fromCache = () => caches.match(req, { ignoreSearch: true })
      .then((r) => r || (isApp ? caches.match('./index.html') : undefined))
      .catch(() => undefined);
    event.respondWith(new Promise((resolve) => {
      let done = false, timer = 0;
      const finish = (r) => { if (!done && r) { done = true; clearTimeout(timer); resolve(r); } };
      fetch(req).then(
        (res) => ((res.status >= 500 || (isApp && res.status === 404)) ? fromCache().then((c) => finish(c || res)) : finish(res)),
        () => fromCache().then((c) => finish(c || Response.error()))
      );
      timer = setTimeout(() => { fromCache().then(finish); }, NAV_TIMEOUT_MS);   // nothing cached: keep waiting
    }));
    return;
  }

  // Static assets: cache-first with background refresh
  event.respondWith(
    caches.match(req).then((cached) => {
      // A versioned file (name.js?v=NN) never changes: serve the cached copy as it is. The server
      // ignores ?v, so refreshing it could store the NEXT version's code under this version's URL.
      if (cached && url.searchParams.has('v')) return cached;
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

// ── Push notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'Hadron Group', body: 'You have a new update.', link: './' };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: payload.tag || 'hadron-update',
      data: { link: payload.link || './' },
      vibrate: [80, 40, 80]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let link = (event.notification.data && event.notification.data.link) || './';

  // Normalise hash-only links so they target the app root (index.html), not
  // the SW file URL. Without this, '#lims/sample/X' resolves to 'sw.js#...'
  // and the user lands on the service-worker source instead of the app.
  if (typeof link === 'string' && link.startsWith('#')) {
    link = './' + link;
  }

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of allClients) {
      if ('focus' in c) {
        c.focus();
        if ('navigate' in c) c.navigate(link);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(link);
  })());
});
