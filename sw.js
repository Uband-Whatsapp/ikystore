// sw.js - RIKY STORE
const DEFAULT_URL = 'https://iky.store.ekkstore.web.id/';
const DEFAULT_ICON = 'https://files.catbox.moe/l0n29q.jpg';
const DEFAULT_BADGE = 'https://files.catbox.moe/l0n29q.jpg';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: 'RIKY STORE', body: event.data.text() };
    }
  }

  const title = data.title || 'RIKY STORE';
  const options = {
    body: data.body || 'Ada pesan baru 👋',
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    tag: data.tag || 'riky-store',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || DEFAULT_URL },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;
  const url = event.notification?.data?.url || DEFAULT_URL;

  if (action === 'open') {
    event.waitUntil(openWebsite(url));
  } else {
    event.waitUntil(openWebsite(url));
  }
});

async function openWebsite(url) {
  const windowClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  for (const client of windowClients) {
    if (client.url.startsWith('https://iky.store.ekkstore.web.id')) {
      return client.focus();
    }
  }
  return clients.openWindow(url);
}