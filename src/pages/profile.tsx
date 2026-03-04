import AppShell from '../layouts/AppShell';
import { Box, Typography, Avatar, Tabs, Tab, CircularProgress, Button, Stack, useTheme } from '@mui/material';
import { useState } from 'react';
import ReviewCard from '../components/ReviewCard';
import { useUser, useUserReviews, usePlaylists } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';

export default function ProfilePage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const { user: authUser } = useAuth();
  const { data: user, isLoading } = useUser(authUser?.id);
  const { data: userReviews } = useUserReviews(authUser?.id);
  const { data: playlists } = usePlaylists();

  if (authLoading || isLoading || !user) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const reviews = userReviews ?? [];

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mb: 1 }} src={user.avatarUrl} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
          <Box
            sx={{
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.getContrastText(theme.palette.secondary.main),
              fontWeight: 700,
              fontSize: 12,
              borderRadius: '12px',
              px: '8px',
              py: '2px',
              lineHeight: 1.4,
            }}
          >
            Lvl {user.level}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {user.followersCount.toLocaleString()} followers · {user.followingCount} following
        </Typography>
        <Typography variant="body1" color="text.secondary">{user.bio}</Typography>

        {/* Edit Profile button */}
        <Link href="/profile/edit" legacyBehavior passHref>
          <Button
            component="a"
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            sx={{
              mt: 1.5,
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                bgcolor: 'transparent',
              },
            }}
          >
            Edit Profile
          </Button>
        </Link>

        <Box sx={{ width: '100%', mt: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Reviews" />
            <Tab label="Playlists" />
          </Tabs>
        </Box>
      </Box>

      {/* Tab content */}
      <Box sx={{ pb: 11 }}>
        {tab === 0 && (
          <>
            {reviews.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  No reviews yet
                </Typography>
              </Box>
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  {...review}
                />
              ))
            )}
          </>
        )}

        {tab === 1 && (
          <Stack spacing={1.5} sx={{ px: 1, mt: 1 }}>
            {(playlists ?? []).length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  No playlists yet
                </Typography>
              </Box>
            ) : (
              (playlists ?? []).map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  legacyBehavior
                  passHref
                >
                  <Box
                    component="a"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '16px',
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : theme.palette.background.paper,
                      boxShadow: theme.palette.mode === 'dark'
                        ? 'none'
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                        {playlist.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {playlist.itemsCount} {playlist.itemsCount === 1 ? 'spot' : 'spots'}
                      </Typography>
                    </Box>
                    <StarIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                  </Box>
                </Link>
              ))
            )}
          </Stack>
        )}
      </Box>
    </AppShell>
  );
}
