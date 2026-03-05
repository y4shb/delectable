import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import AppShell from '../../../layouts/AppShell';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { useUser, useUserReviews, useUserPlaylists, useTasteMatch } from '../../../hooks/useApi';
import FollowButton from '../../../components/FollowButton';
import { useAuth } from '../../../context/AuthContext';
import type { FeedReview, PlaylistSummary } from '../../../types';

function VisibilityIcon({ visibility }: { visibility: string }) {
  if (visibility === 'private') {
    return <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
  }
  if (visibility === 'followers') {
    return <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
  }
  return <PublicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
}

export default function UserProfilePage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { data: user, isLoading: userLoading } = useUser(id as string);
  const { data: reviews, isLoading: reviewsLoading } = useUserReviews(id as string);
  const { data: playlists, isLoading: playlistsLoading } = useUserPlaylists(id as string);
  const { data: tasteMatch } = useTasteMatch(
    authUser && authUser.id !== id ? (id as string) : undefined,
  );

  const isOwnProfile = authUser?.id === id;

  if (!router.isReady || userLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            User not found
          </Typography>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        {/* Back button */}
        <Box sx={{ mb: 1, px: 1 }}>
          <IconButton
            onClick={() => router.back()}
            aria-label="Go back"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Profile header */}
        <Box sx={{ px: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{ width: 80, height: 80, border: '3px solid', borderColor: 'primary.main' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{user.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={`Lvl ${user.level}`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                  }}
                />
                {tasteMatch && !isOwnProfile && (
                  <Chip
                    label={`${Math.round(tasteMatch.score * 100)}% taste match`}
                    size="small"
                    sx={{
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.06)',
                      fontWeight: 600,
                      fontSize: 11,
                      height: 22,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Bio */}
          {user.bio && (
            <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
              {user.bio}
            </Typography>
          )}

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Link href={`/user/${id}/followers`} passHref legacyBehavior>
              <Box
                component="a"
                sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  {user.followersCount}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  Followers
                </Typography>
              </Box>
            </Link>
            <Link href={`/user/${id}/following`} passHref legacyBehavior>
              <Box
                component="a"
                sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  {user.followingCount}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  Following
                </Typography>
              </Box>
            </Link>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                {(reviews ?? []).length}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                Reviews
              </Typography>
            </Box>
          </Box>

          {/* Follow button (not for own profile) */}
          {!isOwnProfile && (
            <FollowButton
              userId={user.id}
              isFollowing={user.isFollowing ?? false}
              fullWidth
            />
          )}

          {/* Edit profile button for own profile */}
          {isOwnProfile && (
            <Link href="/settings/profile" passHref legacyBehavior>
              <Button
                component="a"
                variant="outlined"
                fullWidth
                sx={{
                  borderRadius: '24px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Edit Profile
              </Button>
            </Link>
          )}
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14 },
          }}
        >
          <Tab label="Reviews" />
          <Tab label="Playlists" />
        </Tabs>

        {/* Tab content */}
        {activeTab === 0 && (
          <Box sx={{ px: 1 }}>
            {reviewsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (reviews ?? []).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No reviews yet</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {(reviews ?? []).map((review: FeedReview) => (
                  <Link key={review.id} href={`/review/${review.id}`} passHref legacyBehavior>
                    <Box
                      component="a"
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : theme.palette.background.paper,
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {review.photoUrl && (
                        <Box
                          component="img"
                          src={review.photoUrl}
                          alt={review.venue}
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '12px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {review.venue}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <StarIcon
                              sx={{ fontSize: 14, color: theme.palette.primary.main }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: theme.palette.primary.main,
                              }}
                            >
                              {review.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                        {review.dish && (
                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13, mb: 0.25 }}
                          >
                            {review.dish}
                          </Typography>
                        )}
                        <Typography
                          color="text.secondary"
                          sx={{
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {review.text}
                        </Typography>
                      </Box>
                    </Box>
                  </Link>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ px: 1 }}>
            {playlistsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (playlists ?? []).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No playlists yet</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {(playlists ?? []).map((playlist: PlaylistSummary) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    passHref
                    legacyBehavior
                  >
                    <Box
                      component="a"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : theme.palette.background.paper,
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                            {playlist.title}
                          </Typography>
                          <VisibilityIcon visibility={playlist.visibility} />
                        </Box>
                        {playlist.description && (
                          <Typography
                            color="text.secondary"
                            sx={{
                              fontSize: 13,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {playlist.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                            {playlist.itemsCount} spots
                          </Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                            {playlist.saveCount} saves
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Link>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
