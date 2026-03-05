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
import { useSearch, useSuggestedUsers, useOccasions } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';
import Link from 'next/link';
import FollowButton from '../components/FollowButton';
import type { SearchFilters } from '../types';

const DIETARY_OPTIONS = [
  { value: 'vegan', label: '\uD83C\uDF31 Vegan' },
  { value: 'vegetarian', label: '\uD83E\uDD66 Vegetarian' },
  { value: 'gluten-free', label: '\uD83C\uDF3E Gluten Free' },
  { value: 'halal', label: '\u2728 Halal' },
  { value: 'kosher', label: '\u2721\uFE0F Kosher' },
];

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
  const [occasionFilter, setOccasionFilter] = useState<string | undefined>(undefined);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

  const { data: occasions } = useOccasions();

  const trimmed = query.trim();
  const filters: SearchFilters | undefined =
    occasionFilter || dietaryFilters.length > 0
      ? { occasion: occasionFilter, dietary: dietaryFilters }
      : undefined;
  const { data: results, isLoading: searchLoading } = useSearch(trimmed, 'all', filters);
  const { data: suggestedUsers } = useSuggestedUsers();

  const toggleDietary = (value: string) => {
    setDietaryFilters((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  };

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
  const dishes = results?.dishes ?? [];
  const hasResults = venues.length > 0 || reviews.length > 0 || dishes.length > 0;

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

        {/* Occasion filter chips */}
        {(occasions ?? []).length > 0 && (
          <Box sx={{ maxWidth: 420, mx: 'auto', mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 0.5,
              }}
            >
              {(occasions ?? []).map((tag) => (
                <Chip
                  key={tag.slug}
                  label={`${tag.emoji} ${tag.label}`}
                  size="small"
                  onClick={() =>
                    setOccasionFilter((prev) =>
                      prev === tag.slug ? undefined : tag.slug,
                    )
                  }
                  sx={(theme) => ({
                    flexShrink: 0,
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    bgcolor:
                      occasionFilter === tag.slug
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                    color:
                      occasionFilter === tag.slug
                        ? '#fff'
                        : theme.palette.text.primary,
                  })}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Dietary filter chips */}
        <Box sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {DIETARY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                onClick={() => toggleDietary(opt.value)}
                sx={(theme) => ({
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  bgcolor: dietaryFilters.includes(opt.value)
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(76,175,80,0.3)'
                      : 'rgba(76,175,80,0.15)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  color: dietaryFilters.includes(opt.value)
                    ? theme.palette.mode === 'dark'
                      ? '#81C784'
                      : '#2E7D32'
                    : theme.palette.text.primary,
                })}
              />
            ))}
          </Box>
        </Box>

        {/* Empty state: Recent Searches + Suggested Users */}
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

            {/* Suggested Users */}
            {(suggestedUsers ?? []).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 1.5 }}
                >
                  Suggested for You
                </Typography>
                <Stack spacing={1}>
                  {(suggestedUsers ?? []).slice(0, 5).map((user) => (
                    <Box
                      key={user.id}
                      sx={(theme) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.04)'
                          : theme.palette.background.paper,
                        boxShadow: theme.palette.mode === 'dark'
                          ? 'none'
                          : '0 2px 8px rgba(0,0,0,0.04)',
                      })}
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
                      <FollowButton
                        userId={user.id}
                        isFollowing={user.isFollowing ?? false}
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
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
                          {Number(venue.rating).toFixed(1)}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Dishes section */}
            {dishes.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
                  Dishes
                </Typography>
                <Stack spacing={1.5}>
                  {dishes.map((dish) => (
                    <Link
                      key={dish.id}
                      href={`/dish/${dish.id}`}
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
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: 'rgba(242,77,79,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 18,
                          }}
                        >
                          {'\uD83C\uDF74'}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {dish.name}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {dish.venueDetail?.name ?? dish.category}
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
                          {Number(dish.avgRating).toFixed(1)}
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
                          {Number(review.rating).toFixed(1)}
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
