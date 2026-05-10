importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB4ZKMK015RlWfD_1xYAsmVIceVv0kSx6A',
  authDomain: 'betabeer-3b7fb.firebaseapp.com',
  projectId: 'betabeer-3b7fb',
  storageBucket: 'betabeer-3b7fb.firebasestorage.app',
  messagingSenderId: '215706928947',
  appId: '1:215706928947:web:1f63f8c98d9e0318cde046',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'BetABeer';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
  });
});
