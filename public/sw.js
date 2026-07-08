// JanVyuha service worker — installable PWA + a genuinely working offline shell.
//
// The previous version precached only index.html, so offline the app loaded the
// shell but its hashed JS/CSS (which have build-specific names) failed and the
// app didn't render. This version RUNTIME-CACHES same-origin static assets with
// a stale-while-revalidate strategy, so after one online visit the app works
// offline. API / Supabase / map-tile requests are never cached.
const CACHE = 'janvyuha-v4'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  )
  self.clients.claim()
})

function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api/') &&
    !/\.(map)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache dynamic data or third-party services.
  if (
    request.url.includes('/api/') ||
    request.url.includes('supabase') ||
    request.url.includes('tile.openstreetmap') ||
    request.url.includes('nominatim')
  ) {
    return
  }

  // Navigations: network-first, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Same-origin static assets: stale-while-revalidate.
  if (isCacheableAsset(url)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // Everything else (e.g. fonts CDN): try cache, then network.
  e.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})

// ── Web Push (free) ─────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data ? e.data.json() : {}
  } catch {
    data = { title: 'JanVyuha', body: e.data ? e.data.text() : '' }
  }
  const title = data.title || 'JanVyuha'
  e.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus()
      return self.clients.openWindow(url)
    })
  )
})
