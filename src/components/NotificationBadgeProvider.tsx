import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUnreadCount } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationContextValue {
  unreadCount: number;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refetch: () => {},
});

export function useNotificationBadge() {
  return useContext(NotificationContext);
}

interface NotificationBadgeProviderProps {
  children: ReactNode;
  useSSE?: boolean;
}

export function NotificationBadgeProvider({
  children,
  useSSE = true,
}: NotificationBadgeProviderProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [sseCount, setSSECount] = useState<number | null>(null);
  const [sseActive, setSSEActive] = useState(useSSE);

  // Push notifications -- request permission and register token
  const handleForegroundMessage = useCallback(
    (payload: import('firebase/messaging').MessagePayload) => {
      // When a push arrives while the app is focused, refresh the
      // notification count and invalidate the list query.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

      // Show a native notification even in the foreground so the user
      // does not miss it.
      if (payload.notification && 'Notification' in window) {
        const { title, body } = payload.notification;
        try {
          new Notification(title ?? 'Delectable', {
            body: body ?? 'You have a new notification',
            icon: '/icons/icon-192.png',
          });
        } catch {
          // Notification constructor may not be available in all contexts
        }
      }
    },
    [queryClient],
  );

  usePushNotifications(handleForegroundMessage);

  // Polling fallback — only when authenticated
  const { data: polledCount, refetch } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: fetchUnreadCount,
    refetchInterval: sseActive ? false : 30000,
    staleTime: 10000,
    enabled: isAuthenticated,
  });

  // SSE connection — only when authenticated
  useEffect(() => {
    if (!useSSE || !isAuthenticated) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/notifications/stream/');

        eventSource.onopen = () => {
          reconnectAttempts = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected' || data.type === 'update') {
              setSSECount(data.unread_count ?? data.unreadCount ?? 0);
              // Invalidate notifications query to refresh list if open
              if (data.type === 'update') {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            // Fall back to polling
            console.warn('SSE connection failed, falling back to polling');
            setSSEActive(false);
          }
        };
      } catch (e) {
        console.error('Failed to create EventSource:', e);
      }
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [useSSE, isAuthenticated, queryClient]);

  const handleRefetch = useCallback(() => {
    refetch();
    setSSECount(null); // Clear SSE count to show fresh poll
  }, [refetch]);

  const unreadCount = sseCount ?? polledCount ?? 0;

  return (
    <NotificationContext.Provider value={{ unreadCount, refetch: handleRefetch }}>
      {children}
    </NotificationContext.Provider>
  );
}
