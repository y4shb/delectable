import AppShell from '../layouts/AppShell';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface Notification {
  id: number;
  text: string;
  timestamp: string;
  avatarUrl: string;
  unread: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    text: 'Yash Bhardwaj liked your review of SavorWorks',
    timestamp: '2h ago',
    avatarUrl: '/images/avatar1.jpg',
    unread: true,
  },
  {
    id: 2,
    text: 'New review at Paul by Mad Max',
    timestamp: '4h ago',
    avatarUrl: '/images/avatar1.jpg',
    unread: true,
  },
  {
    id: 3,
    text: 'Jason Derulo started following you',
    timestamp: '1d ago',
    avatarUrl: '/images/avatar1.jpg',
    unread: false,
  },
  {
    id: 4,
    text: "Your playlist 'Best Coffee Shops' got 5 new saves",
    timestamp: '2d ago',
    avatarUrl: '/images/avatar1.jpg',
    unread: false,
  },
  {
    id: 5,
    text: 'Trending: Big Chill is popular this week',
    timestamp: '3d ago',
    avatarUrl: '/images/avatar1.jpg',
    unread: false,
  },
];

export default function NotificationsPage() {
  useRequireAuth();
  const theme = useTheme();

  return (
    <AppShell>
      <Box
        sx={{
          width: '100%',
          pb: 11,
        }}
      >
        {/* Page Title */}
        <Box sx={{ mb: 3, textAlign: 'left', px: 0.5, pt: 1 }}>
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
        </Box>

        {/* Notification List */}
        <Box>
          {mockNotifications.map((notification) => (
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
              {/* Avatar */}
              <Avatar
                src={notification.avatarUrl}
                sx={{ width: 36, height: 36, flexShrink: 0 }}
              />

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
                  {notification.timestamp}
                </Typography>
              </Box>

              {/* Unread Dot */}
              {notification.unread && (
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
          ))}
        </Box>
      </Box>
    </AppShell>
  );
}
