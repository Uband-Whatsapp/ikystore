// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 🔴 GANTI DATA DI BAWAH INI DENGAN PUNYA KAMU
firebase.initializeApp({
  apiKey: "AIzaSy...",              // ganti dengan apiKey kamu
  authDomain: "riky-store-push.firebaseapp.com",
  projectId: "riky-store-push",
  storageBucket: "riky-store-push.appspot.com",
  messagingSenderId: "1234567890",   // ganti dengan senderId kamu
  appId: "1:1234567890:web:abcdef"   // ganti dengan appId kamu
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Notifikasi latar belakang:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'  // ganti dengan icon kamu (opsional)
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
