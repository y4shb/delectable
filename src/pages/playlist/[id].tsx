import { useState } from 'react';
import AppShell from '../../layouts/AppShell';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlaylistDetail } from '../../hooks/useApi';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../context/AuthContext';
import { savePlaylist, unsavePlaylist, forkPlaylist } from '../../api/api';
import Link from 'next/link';

function VisibilityBadge({ visibility }: { visibility: string }) {
  const theme = useTheme();

  let icon = <PublicIcon sx={{ fontSize: 14 }} />;
  let label = 'Public';

  if (visibility === 'private') {
    icon = <LockIcon sx={{ fontSize: 14 }} />;
    label = 'Private';
  } else if (visibility === 'followers') {
    icon = <PeopleIcon sx={{ fontSize: 14 }} />;
    label = 'Followers';
  }

  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        fontWeight: 500,
        fontSize: 12,
        height: 24,
      }}
    />
  );
}

export default function PlaylistDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: playlist, isLoading: playlistLoading } = usePlaylistDetail(id as string);

  const isOwner = authUser?.id === playlist?.owner?.id;

  const saveMutation = useMutation({
    mutationFn: () => savePlaylist(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlistDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['savedPlaylists'] });
      setSnackbarMessage('Playlist saved to your library');
      setSnackbarOpen(true);
    },
    onError: () => {
      setSnackbarMessage('Failed to save playlist');
      setSnackbarOpen(true);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsavePlaylist(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlistDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['savedPlaylists'] });
      setSnackbarMessage('Playlist removed from your library');
      setSnackbarOpen(true);
    },
    onError: () => {
      setSnackbarMessage('Failed to remove playlist');
      setSnackbarOpen(true);
    },
  });

  const forkMutation = useMutation({
    mutationFn: () => forkPlaylist(id as string),
    onSuccess: (forkedPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setSnackbarMessage('Playlist forked to your collection');
      setSnackbarOpen(true);
      // Navigate to the forked playlist
      router.push(`/playlist/${forkedPlaylist.id}`);
    },
    onError: () => {
      setSnackbarMessage('Failed to fork playlist');
      setSnackbarOpen(true);
    },
  });

  const handleSaveToggle = () => {
    if (saveMutation.isPending || unsaveMutation.isPending) return;

    if (playlist?.isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const handleFork = () => {
    if (forkMutation.isPending) return;
    forkMutation.mutate();
  };

  // Handle SSR / static first render where router.query is not yet populated
  if (!router.isReady || playlistLoading) {
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
          <CircularProgress size={32} />
        </Box>
      </AppShell>
    );
  }

  if (!playlist) {
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
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            Playlist not found
          </Typography>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
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

      {/* Header area */}
      <Box sx={{ mb: 3, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontFamily: '"Classy Pen", Helvetica, sans-serif',
              }}
            >
              {playlist.title}
            </Typography>
            {playlist.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {playlist.description}
              </Typography>
            )}
          </Box>
          <VisibilityBadge visibility={playlist.visibility} />
        </Box>

        {/* Owner info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <Link href={`/user/${playlist.owner.id}`} passHref legacyBehavior>
            <Box component="a" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
              <Avatar src={playlist.owner.avatarUrl} sx={{ width: 24, height: 24 }} />
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                {playlist.owner.name}
              </Typography>
            </Box>
          </Link>
        </Box>

        {/* Forked from indicator */}
        {playlist.forkedFrom && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <ForkRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Forked from{' '}
              <Link href={`/playlist/${playlist.forkedFrom.id}`} passHref legacyBehavior>
                <Typography
                  component="a"
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {playlist.forkedFrom.title}
                </Typography>
              </Link>
              {' by '}
              <Link href={`/user/${playlist.forkedFrom.owner.id}`} passHref legacyBehavior>
                <Typography
                  component="a"
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {playlist.forkedFrom.owner.name}
                </Typography>
              </Link>
            </Typography>
          </Box>
        )}

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
          <Typography sx={{ fontSize: 14, color: theme.palette.primary.main, fontWeight: 600 }}>
            {playlist.items.length} {playlist.items.length === 1 ? 'spot' : 'spots'}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            {playlist.saveCount} saves
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            {playlist.forkCount} forks
          </Typography>
        </Box>

        {/* Action buttons (for non-owners) */}
        {!isOwner && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant={playlist.isSaved ? 'contained' : 'outlined'}
              startIcon={playlist.isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              onClick={handleSaveToggle}
              disabled={saveMutation.isPending || unsaveMutation.isPending}
              sx={{
                flex: 1,
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {playlist.isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ForkRightIcon />}
              onClick={handleFork}
              disabled={forkMutation.isPending}
              sx={{
                flex: 1,
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Fork
            </Button>
          </Stack>
        )}
      </Box>

      {/* Playlist items */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pb: 11,
        }}
      >
        {playlist.items.map((item) => (
          <Link
            key={item.id}
            href={`/venue/${item.venueDetail?.id ?? item.venue}`}
            legacyBehavior
            passHref
          >
          <Box
            component="a"
            sx={(theme) => ({
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              borderRadius: 4,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
              border:
                theme.palette.mode === 'dark'
                  ? '6px solid rgba(0,0,0,0.3)'
                  : '6px solid rgba(255,255,255,0.3)',
              mb: 2,
              overflow: 'hidden',
              maxWidth: 420,
              width: '90%',
              position: 'relative',
              bgcolor: theme.palette.background.paper,
            })}
          >
            {/* Photo with gradient overlay */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1.2',
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eee',
              }}
            >
              {item.venueDetail?.photoUrl && (
                <img
                  src={item.venueDetail.photoUrl}
                  alt={item.caption || 'Playlist item'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}

              {/* Gradient overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  p: 2.5,
                  pt: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {item.caption && (
                  <Typography
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 18,
                      textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.caption}
                  </Typography>
                )}
                {item.venueDetail && (
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 500,
                      fontSize: 13,
                      mt: 0.5,
                      textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
                    }}
                  >
                    {item.venueDetail.name} &middot; {item.venueDetail.locationText}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          </Link>
        ))}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </AppShell>
  );
}
