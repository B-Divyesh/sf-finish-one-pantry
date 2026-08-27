const VERSION = 'finish-one-pantry-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const BUILD_ASSETS = __BUILD_ASSETS__;
const STATIC = [
  '/', '/offline.html', '/manifest.webmanifest', '/icons/icon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  '/images/notebook-pantry-640.avif', '/images/notebook-pantry-640.webp',
  '/images/notebook-pantry-960.webp', '/images/notebook-pantry-960.jpg',
  ...BUILD_ASSETS
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll([...new Set(STATIC)])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((names) => Promise.all(names.filter((name) => ![SHELL, RUNTIME].includes(name)).map((name) => caches.delete(name)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request, { ignoreVary: true })) || (await caches.match(url.pathname === '/privacy' ? '/privacy/index.html' : url.pathname === '/terms' ? '/terms/index.html' : '/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }

  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(RUNTIME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
