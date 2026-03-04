import { useState } from 'react';
import {
  TextField,
  InputAdornment,
  Typography,
  Avatar,
  Box,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppShell from '../layouts/AppShell';
import { useSearch } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';
import Link from 'next/link';

const recentSearches = [
  'SavorWorks',
  'Sushi',
  'Italian',
  'Big Chill',
  'Pasta',
];

export default function SearchPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const { data: results, isLoading: searchLoading } = useSearch(trimmed);

  if (authLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const venues = results?.venues ?? [];
  const reviews = results?.reviews ?? [];
  const hasResults = venues.length > 0 || reviews.length > 0;

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        {/* Search input */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search venues, dishes, people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search venues, dishes, people"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: (theme) => ({
                  borderRadius: '48px',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.24)'
                      : 'rgba(0,0,0,0.24)',
                  },
                }),
              },
            }}
            sx={{ maxWidth: 420, mx: 'auto' }}
          />
        </Box>

        {/* Empty state: Recent Searches */}
        {!trimmed && (
          <Box sx={{ maxWidth: 420, mx: 'auto' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1.5 }}
            >
              Recent Searches
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {recentSearches.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onClick={() => setQuery(item)}
                  sx={(theme) => ({
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.14)'
                          : 'rgba(0,0,0,0.1)',
                    },
                  })}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Loading state */}
        {trimmed && searchLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {/* Search results */}
        {trimmed && !searchLoading && !hasResults && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography color="text.secondary" sx={{ fontSize: 16 }}>
              No results found
            </Typography>
          </Box>
        )}

        {trimmed && !searchLoading && hasResults && (
          <Stack spacing={3} sx={{ maxWidth: 420, mx: 'auto' }}>
            {/* Venues section */}
            {venues.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
                  Venues
                </Typography>
                <Stack spacing={1.5}>
                  {venues.map((venue) => (
                    <Link
                      key={venue.id}
                      href={`/venue/${venue.id}`}
                      legacyBehavior
                      passHref
                    >
                      <Box
                        component="a"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        {venue.photoUrl && (
                          <Box
                            component="img"
                            src={venue.photoUrl}
                            alt={venue.name}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                            {venue.name}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {venue.cuisineType}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: 15,
                            flexShrink: 0,
                          }}
                        >
                          {venue.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Reviews section */}
            {reviews.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
                  Reviews
                </Typography>
                <Stack spacing={1.5}>
                  {reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={review.venueDetail ? `/venue/${review.venueDetail.id}` : '#'}
                      legacyBehavior
                      passHref
                    >
                      <Box
                        component="a"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <Avatar
                          src={review.user.avatarUrl}
                          sx={{ width: 32, height: 32, flexShrink: 0 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {review.venueDetail?.name ?? ''}
                          </Typography>
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
                        <Typography
                          sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {review.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </AppShell>
  );
}
