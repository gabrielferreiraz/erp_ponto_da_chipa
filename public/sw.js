const CACHE_NAME = 'chipa-erp-v1'

// Assets to pre-cache on install (shell)
const PRECACHE_URLS = [
  '/',
]

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  // Take control immediately without waiting for old SW to retire
  self.skipWaiting()
})

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: Network-first, fall back to cache ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip API routes and Next.js internals — always go to network
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__nextjs')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for static assets
        if (
          networkResponse.ok &&
          (url.pathname.startsWith('/icons/') ||
            url.pathname.startsWith('/images/') ||
            url.pathname === '/manifest.json')
        ) {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return networkResponse
      })
      .catch(() => {
        // Network failed — serve from cache if available
        return caches.match(event.request).then(
          (cached) => cached ?? new Response('Offline', { status: 503 })
        )
      })
  )
})
