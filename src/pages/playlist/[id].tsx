import AppShell from '../../layouts/AppShell';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { mockPlaylists, mockVenues } from '../../api/mockApi';

export default function PlaylistDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const playlist = mockPlaylists.find((p) => p.id === id);

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
          sx={{ mt: 0.5, color: '#F24D4F', fontWeight: 600 }}
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
          const venue = mockVenues.find((v) => v.id === item.venueId);

          return (
            <Box
              key={item.id}
              sx={(theme) => ({
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
                  background: '#eee',
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
          );
        })}
      </Box>
    </AppShell>
  );
}
