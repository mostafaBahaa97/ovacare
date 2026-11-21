// App-shell only. NEVER caches /api/* (medical data lives in IndexedDB only).
const V = 'ovacare-shell-v2';
const SHELL = ['/', '/patients', '/settings'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || (u.pathname.startsWith('/api/') && u.pathname !== '/api/icon') || u.searchParams.has('_rsc')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(u.pathname, cp)); } return res; })
      .catch(async () => (await caches.match(u.pathname, { ignoreSearch: true })) || (await caches.match('/'))));
    return;
  }
  if (u.pathname.startsWith('/_next/static/') || u.pathname === '/api/icon' || /\.(woff2?|png|svg|ico)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
  }
});
