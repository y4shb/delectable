import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUnreadCount } from '../api/api';

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
  const queryClient = useQueryClient();
  const [sseCount, setSSECount] = useState<number | null>(null);

  // Polling fallback
  const { data: polledCount, refetch } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: fetchUnreadCount,
    refetchInterval: useSSE ? false : 30000, // Poll every 30s if SSE disabled
    staleTime: 10000,
  });

  // SSE connection
  useEffect(() => {
    if (!useSSE) return;

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
  }, [useSSE, queryClient]);

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
