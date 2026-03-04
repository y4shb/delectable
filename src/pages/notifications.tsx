import AppShell from '../layouts/AppShell';
import { Box, Typography, CircularProgress, Button, useTheme } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useNotifications } from '../hooks/useApi';
import { markNotificationsRead } from '../api/api';
import { useQueryClient } from '@tanstack/react-query';

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

export default function NotificationsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: notifData, isLoading: notifsLoading } = useNotifications();
  const notifications = notifData?.results ?? [];
  const unreadCount = notifData?.meta?.unreadCount ?? 0;

  const handleMarkAllRead = async () => {
    await markNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (authLoading || notifsLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box
        sx={{
          width: '100%',
          pb: 11,
        }}
      >
        {/* Page Title */}
        <Box sx={{ mb: 3, textAlign: 'left', px: 0.5, pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              fontSize: '28px',
              lineHeight: 1.2,
              fontFamily: '"Classy Pen", Helvetica, sans-serif',
              letterSpacing: 1,
            }}
          >
            Alerts
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notification List */}
        <Box>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 2,
                  borderBottom: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.06)'
                  }`,
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Notification icon */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </Box>

                {/* Text Content */}
                <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: '14px',
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '12px',
                    }}
                  >
                    {formatRelativeTime(notification.createdAt)}
                  </Typography>
                </Box>

                {/* Unread Dot */}
                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      flexShrink: 0,
                      ml: 1,
                    }}
                  />
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </AppShell>
  );
}
