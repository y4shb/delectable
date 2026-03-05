import { useRouter } from 'next/router';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppShell from '../../../layouts/AppShell';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { useFollowing } from '../../../hooks/useApi';
import FollowButton from '../../../components/FollowButton';
import { useAuth } from '../../../context/AuthContext';

export default function FollowingPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const { user: authUser } = useAuth();
  const { data: following, isLoading } = useFollowing(id as string);

  if (!router.isReady || isLoading) {
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
      <Box sx={{ pb: 11 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Go back">
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
            Following
          </Typography>
        </Box>

        {(following ?? []).length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography color="text.secondary">Not following anyone yet</Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {(following ?? []).map((user) => (
              <Box
                key={user.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '16px',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : theme.palette.background.paper,
                }}
              >
                <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                    {user.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    Lvl {user.level}
                  </Typography>
                </Box>
                {authUser && authUser.id !== user.id && (
                  <FollowButton
                    userId={user.id}
                    isFollowing={user.isFollowing ?? false}
                    size="small"
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </AppShell>
  );
}
