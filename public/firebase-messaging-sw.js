/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging service worker.
 *
 * Handles background push notifications when the app tab is not focused.
 * The Firebase config is injected at build time via environment variables
 * that are inlined into this file by the Next.js public folder mechanism.
 *
 * IMPORTANT: This file MUST live at the root of the public directory so
 * the browser can register it at the root scope ("/").
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config -- values are read from the build environment.
// In production these should be replaced by a build step or served
// from an endpoint. For local development the defaults are safe stubs.
const firebaseConfig = {
  apiKey: '__NEXT_PUBLIC_FIREBASE_API_KEY__',
  authDomain: '__NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__',
  projectId: '__NEXT_PUBLIC_FIREBASE_PROJECT_ID__',
  storageBucket: '__NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__NEXT_PUBLIC_FIREBASE_APP_ID__',
};

// Only initialize if we have a real config (not placeholder strings)
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('__')) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle =
      (payload.notification && payload.notification.title) || 'Delectable';
    const notificationOptions = {
      body:
        (payload.notification && payload.notification.body) ||
        'You have a new notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: payload.data || {},
      tag: (payload.data && payload.data.notification_type) || 'default',
      renotify: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click -- open the app or focus existing tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/notifications';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing tab if one is open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
