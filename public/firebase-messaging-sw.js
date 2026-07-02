importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAWsYuGhHo3vHHq6I75T6suNAZiJXZA8rY",
  authDomain: "schedule-app-824fc.firebaseapp.com",
  projectId: "schedule-app-824fc",
  storageBucket: "schedule-app-824fc.firebasestorage.app",
  messagingSenderId: "490163295402",
  appId: "1:490163295402:web:a58787239b996f61352cd3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
