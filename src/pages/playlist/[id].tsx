import AppShell from '../../layouts/AppShell';
import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import { usePlaylistDetail, useVenues } from '../../hooks/useApi';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import Link from 'next/link';

export default function PlaylistDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;

  const { data: playlist, isLoading: playlistLoading } = usePlaylistDetail(
    id as string,
  );
  const { data: venues, isLoading: venuesLoading } = useVenues();

  // Handle SSR / static first render where router.query is not yet populated
  if (!router.isReady || playlistLoading || venuesLoading) {
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
        <Typography
          variant="body2"
          sx={{ mt: 0.5, color: theme.palette.primary.main, fontWeight: 600 }}
        >
          {playlist.items.length} {playlist.items.length === 1 ? 'spot' : 'spots'}
        </Typography>
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
        {playlist.items.map((item) => {
          const venue = (venues ?? []).find((v) => v.id === item.venueId);

          return (
            <Link
              key={item.id}
              href={`/venue/${item.venueId}`}
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
                {item.photoUrl && (
                  <img
                    src={item.photoUrl}
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
                  {venue && (
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500,
                        fontSize: 13,
                        mt: 0.5,
                        textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
                      }}
                    >
                      {venue.name} &middot; {venue.location}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            </Link>
          );
        })}
      </Box>
    </AppShell>
  );
}
