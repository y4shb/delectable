/**
 * Firebase Cloud Messaging client-side module.
 *
 * Provides helpers to:
 * - Initialize the Firebase app (lazily, once)
 * - Request notification permission and obtain an FCM token
 * - Listen for foreground messages
 *
 * All Firebase config values are read from NEXT_PUBLIC_FIREBASE_* env vars.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

/**
 * Returns true when we have enough config to initialize Firebase.
 */
function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Get or create the Firebase app singleton.
 */
function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Get the Firebase Messaging instance. Returns null when Firebase is
 * not configured or when running in a non-browser environment.
 */
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    return getMessaging(app);
  } catch {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }
}

/**
 * Request notification permission from the browser and retrieve the
 * FCM registration token.
 *
 * @returns The FCM token string, or null if permission was denied or
 *          Firebase is not configured.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Check browser support
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.info('Notification permission denied');
    return null;
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? '';
  if (!vapidKey) {
    console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set');
    return null;
  }

  try {
    // Register the service worker explicitly so Firebase uses it
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
    );

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Subscribe to foreground messages. Returns an unsubscribe function.
 *
 * @param callback - Called with the message payload when a push arrives
 *                   while the app is in the foreground.
 */
export function onMessageListener(
  callback: (payload: MessagePayload) => void,
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  return onMessage(messaging, callback);
}
