// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDcj0yRzKmOxaT1sugTsKhl9-fh2288uCU",
  authDomain: "riky-store-push.firebaseapp.com",
  projectId: "riky-store-push",
  storageBucket: "riky-store-push.firebasestorage.app",
  messagingSenderId: "700709840952",
  appId: "1:700709840952:web:d2efb042652f931d269ecd"
});

const messaging = firebase.messaging();

// Notifikasi background
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Notifikasi background:', payload);
  const title = payload.notification.title || 'RIKY STORE';
  const options = {
    body: payload.notification.body || 'Ada notifikasi baru',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'riky-store',
    data: payload.data || {}
  };
  return self.registration.showNotification(title, options);
});

// Event SW agar tetap aktif
self.addEventListener('install', (event) => {
  console.log('✅ SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW activated');
  event.waitUntil(clients.claim());
});

// Tambahkan event fetch (biar SW tidak dianggap idle)
self.addEventListener('fetch', (event) => {
  // Tidak perlu melakukan apa-apa, cukup agar SW tetap hidup
  event.respondWith(fetch(event.request));
});

console.log('🔥 Service Worker RIKY STORE siap!');