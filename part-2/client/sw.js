const precacheName = '<%= precacheName %>';
const precacheList = <%- precacheList %>

async function matchPrecache(url) {
  let cacheKey;
  const { pathname } = new URL(url, location);
  if (pathname === '/') {
    cacheKey = '/index.html';
  } else if (/^\/create|\/edit\/\d+$/.test(pathname)) {
    cacheKey = '/edit.html';
  } else if (/^\/detail\/\d+$/.test(pathname)) {
    cacheKey = '/detail.html';
  } else {
    cacheKey = pathname;
  }

  if (precacheList.includes(cacheKey)) {
    const cache = await caches.open(precacheName);
    return {
      type: 'precache',
      response: await cache.match(cacheKey)
    };
  }

  return null;
}

async function matchCache(url) {
  return await matchPrecache(url);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(precacheName);
    await cache.addAll(precacheList);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    const cacheNames = await caches.keys();
    cacheNames.filter(
      cacheName => cacheName !== precacheName
    ).forEach(async cacheName => await caches.delete(cacheName));
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method.toLowerCase() === 'get') {
    event.respondWith((async () => {
      const { response: cachedResponse } = await matchCache(event.request.url) || {};
      if (cachedResponse) {
        return cachedResponse;
      }
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse) {
        return preloadResponse;
      }
      return await fetch(event.request.clone());
    })());
  }
});