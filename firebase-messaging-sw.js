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

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background:', payload);
  const title = payload.notification.title || 'RIKY STORE';
  const options = {
    body: payload.notification.body || 'Ada notifikasi baru',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'riky-store'
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
self.addEventListener('fetch', (event) => event.respondWith(fetch(event.request)));
console.log('🔥 SW RIKY STORE siap!');