
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

messaging.onBackgroundMessage((payload) => {
  console.log('Notifikasi latar belakang:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});