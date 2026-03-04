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
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useVenueDetail, useVenueReviews, useVenues } from '../../hooks/useApi';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';

export default function VenueDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);

  const { data: venue, isLoading: venueLoading } = useVenueDetail(id as string);
  const { data: reviews, isLoading: reviewsLoading } = useVenueReviews(id as string);
  const { data: allVenues } = useVenues();

  // Handle SSR / static first render where router.query is not yet populated
  if (!router.isReady || venueLoading || reviewsLoading) {
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

  if (!venue) {
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
            Venue not found
          </Typography>
        </Box>
      </AppShell>
    );
  }

  const relatedVenues = (allVenues ?? [])
    .filter((v) => v.id !== venue.id)
    .slice(0, 4);

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

        {/* Hero photo */}
        <Box
          sx={{
            position: 'relative',
            width: '100vw',
            height: 250,
            mx: 'calc(-50vw + 50%)',
            overflow: 'hidden',
          }}
        >
          {venue.photoUrl && (
            <Box
              component="img"
              src={venue.photoUrl}
              alt={venue.name}
              sx={{
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
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            }}
          />
        </Box>

        {/* Venue info section */}
        <Box sx={{ mt: 2, px: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
            {venue.name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
            {venue.cuisineType}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.25 }}>
            {venue.locationText}
          </Typography>

          {/* Rating badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
            }}
          >
            <StarIcon
              sx={{ fontSize: 20, color: theme.palette.primary.main }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 16,
                color: theme.palette.primary.main,
              }}
            >
              {venue.rating.toFixed(1)}
            </Typography>
          </Box>

          {/* Tags */}
          {venue.tags && venue.tags.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              {venue.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    borderRadius: '16px',
                    fontWeight: 500,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, px: 1 }}>
          <Link href={`/review/new?venueId=${venue.id}`} legacyBehavior passHref>
            <Button
              component="a"
              variant="contained"
              disableElevation
              sx={{
                flex: 1,
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              Write Review
            </Button>
          </Link>
          <Button
            variant="outlined"
            onClick={() => setPlaylistSheetOpen(true)}
            sx={{
              flex: 1,
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
            Add to Playlist
          </Button>
        </Stack>

        {/* Reviews section */}
        <Box sx={{ mt: 4, px: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
            Reviews
          </Typography>

          {(reviews ?? []).length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              No reviews yet. Be the first to write one!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {(reviews ?? []).map((review) => (
                <Box
                  key={`${review.user.name}-${review.rating}`}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                  }}
                >
                  <Avatar
                    src={review.user.avatarUrl}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.25,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {review.user.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {review.rating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 13 }}
                    >
                      {review.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Related venues — Nearby */}
        {relatedVenues.length > 0 && (
          <Box sx={{ mt: 4, px: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
              Nearby
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 1,
              }}
            >
              {relatedVenues.map((rv) => (
                <Link
                  key={rv.id}
                  href={`/venue/${rv.id}`}
                  legacyBehavior
                  passHref
                >
                  <Box
                    component="a"
                    sx={{
                      flexShrink: 0,
                      width: 150,
                      borderRadius: '32px',
                      overflow: 'hidden',
                      bgcolor: theme.palette.background.paper,
                      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {rv.photoUrl && (
                      <Box
                        component="img"
                        src={rv.photoUrl}
                        alt={rv.name}
                        sx={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rv.name}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 0.25,
                        }}
                      >
                        <StarIcon
                          sx={{
                            fontSize: 14,
                            color: theme.palette.primary.main,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {rv.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Link>
              ))}
            </Box>
          </Box>
        )}
        {/* Add to Playlist sheet */}
        <AddToPlaylistSheet
          open={playlistSheetOpen}
          onClose={() => setPlaylistSheetOpen(false)}
          venueId={venue.id}
        />
      </Box>
    </AppShell>
  );
}
