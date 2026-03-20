/**
 * React hook for managing FCM push notification lifecycle.
 *
 * - Requests permission and registers the device token on mount
 *   (only when the user is authenticated).
 * - Listens for foreground messages and surfaces them via a callback.
 * - Provides an `unregister` helper for logout flows.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  requestNotificationPermission,
  onMessageListener,
} from '../lib/firebase';
import api from '../api/client';
import type { MessagePayload } from 'firebase/messaging';

interface PushNotificationState {
  /** Whether the user has granted notification permission. */
  isPermissionGranted: boolean;
  /** The FCM token currently registered with the backend. */
  token: string | null;
  /** Whether the hook is currently requesting permission / registering. */
  isLoading: boolean;
  /** Manually unregister the device token (e.g. on logout). */
  unregister: () => Promise<void>;
}

/**
 * Detect the client platform for the device token record.
 */
function detectPlatform(): 'web' | 'ios' | 'android' {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }
  return 'web';
}

export function usePushNotifications(
  onForegroundMessage?: (payload: MessagePayload) => void,
): PushNotificationState {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Register token with the backend
  const registerToken = useCallback(async (fcmToken: string) => {
    try {
      await api.post('/notifications/devices/register/', {
        token: fcmToken,
        platform: detectPlatform(),
      });
    } catch (error) {
      console.error('Failed to register device token with backend:', error);
    }
  }, []);

  // Unregister token from the backend
  const unregister = useCallback(async () => {
    if (!token) return;
    try {
      await api.delete('/notifications/devices/unregister/', {
        data: { token },
      });
    } catch (error) {
      console.error('Failed to unregister device token:', error);
    }
    setToken(null);
    setIsPermissionGranted(false);
  }, [token]);

  // Main effect: request permission + register on auth
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function setup() {
      setIsLoading(true);
      try {
        const fcmToken = await requestNotificationPermission();
        if (cancelled) return;

        if (fcmToken) {
          setToken(fcmToken);
          setIsPermissionGranted(true);
          await registerToken(fcmToken);
        }
      } catch (error) {
        console.error('Push notification setup failed:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, registerToken]);

  // Foreground message listener
  useEffect(() => {
    if (!isAuthenticated || !isPermissionGranted) return;

    const unsubscribe = onMessageListener((payload) => {
      if (onForegroundMessage) {
        onForegroundMessage(payload);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, isPermissionGranted, onForegroundMessage]);

  return {
    isPermissionGranted,
    token,
    isLoading,
    unregister,
  };
}
