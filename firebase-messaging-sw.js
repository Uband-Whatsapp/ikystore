// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDcj0yRzKmOxaT1sugTsKhl9-fh2288uCU",
  authDomain: "riky-store-push.firebaseapp.com",
  projectId: "riky-store-push",
  storageBucket: "riky-store-push.firebasestorage.app",
  messagingSenderId: "700709840952",
  appId: "1:700709840952:web:d2efb042652f931d269ecd",
  measurementId: "G-SCS91DNX9P"
});

const messaging = firebase.messaging();

// Event ketika notifikasi diterima di background
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Notifikasi background:', payload);
  const notificationTitle = payload.notification.title || 'RIKY STORE';
  const notificationOptions = {
    body: payload.notification.body || 'Ada notifikasi baru',
    icon: '/icon.png', // ganti dengan icon jika ada
    tag: 'riky-store',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Event ketika service worker diinstal
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Event ketika service worker diaktifkan
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});