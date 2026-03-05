import AppShell from '../layouts/AppShell';
import { Box, Chip, Stack, Typography, IconButton, CircularProgress, useTheme } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import StarIcon from '@mui/icons-material/Star';
import GoogleMapView from '../components/GoogleMapView';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useVenues, useFriendsVenues } from '../hooks/useApi';
import Link from 'next/link';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import PeopleIcon from '@mui/icons-material/People';

const CUISINE_OPTIONS = ['Japanese', 'Italian', 'American', 'European', 'Experimental'];

export default function MapPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: venues, isLoading: venuesLoading } = useVenues();

  const { data: friendsVenues } = useFriendsVenues();

  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [ratingActive, setRatingActive] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    if (viewMode === 'map') {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [viewMode]);

  const handleCuisineToggle = (cuisine: string) => {
    setCuisineFilter((prev) => (prev === cuisine ? null : cuisine));
  };

  const handleRatingToggle = () => {
    if (ratingActive) {
      setRatingActive(false);
      setMinRating(undefined);
    } else {
      setRatingActive(true);
      setMinRating(8);
    }
  };

  if (authLoading || venuesLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const allVenues = venues ?? [];

  // Filter venues for list view
  const filteredVenues = allVenues.filter((v) => {
    if (cuisineFilter && v.cuisineType !== cuisineFilter) return false;
    if (minRating != null && v.rating < minRating) return false;
    return true;
  });

  return (
    <AppShell>
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          m: 0,
          p: 0,
          zIndex: 0,
        }}
      >
        {/* Filter bar overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 72,
            left: 0,
            right: 0,
            zIndex: 10,
            px: 2,
            py: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: '48px',
              px: 2,
              py: 0.75,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            {/* Cuisine chips — horizontally scrollable */}
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                flex: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {CUISINE_OPTIONS.map((cuisine) => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  size="small"
                  onClick={() => handleCuisineToggle(cuisine)}
                  sx={{
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                    bgcolor:
                      cuisineFilter === cuisine
                        ? theme.palette.primary.main
                        : isDark
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.06)',
                    color:
                      cuisineFilter === cuisine
                        ? '#fff'
                        : theme.palette.text.primary,
                    '&:hover': {
                      bgcolor:
                        cuisineFilter === cuisine
                          ? theme.palette.primary.dark
                          : isDark
                            ? 'rgba(255,255,255,0.18)'
                            : 'rgba(0,0,0,0.1)',
                    },
                  }}
                />
              ))}

              {/* Rating filter chip */}
              <Chip
                label="8+"
                size="small"
                icon={<StarIcon sx={{ fontSize: 14 }} />}
                onClick={handleRatingToggle}
                sx={{
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: 12,
                  flexShrink: 0,
                  bgcolor: ratingActive
                    ? theme.palette.primary.main
                    : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                  color: ratingActive ? '#fff' : theme.palette.text.primary,
                  '& .MuiChip-icon': {
                    color: ratingActive ? '#fff' : theme.palette.text.secondary,
                  },
                  '&:hover': {
                    bgcolor: ratingActive
                      ? theme.palette.primary.dark
                      : isDark
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(0,0,0,0.1)',
                  },
                }}
              />
            </Box>

            {/* Map/List toggle + overlays */}
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => setHeatmapMode((p) => !p)}
                sx={{
                  color: heatmapMode
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
                aria-label="Toggle heatmap"
              >
                <ThermostatIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setShowFriends((p) => !p)}
                sx={{
                  color: showFriends
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
                aria-label="Toggle friends venues"
              >
                <PeopleIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('map')}
                sx={{
                  color:
                    viewMode === 'map'
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                }}
                aria-label="Map view"
              >
                <MapIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  color:
                    viewMode === 'list'
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                }}
                aria-label="List view"
              >
                <ViewListIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Map or List view */}
        {viewMode === 'map' ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: 'none',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <GoogleMapView
              venues={allVenues}
              cuisineFilter={cuisineFilter}
              minRating={minRating}
              heatmapMode={heatmapMode}
              friendsVenues={showFriends ? friendsVenues : undefined}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              pt: 16,
              pb: 12,
              px: 2,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 600, mx: 'auto' }}>
              {filteredVenues.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Typography color="text.secondary" sx={{ fontSize: 16 }}>
                    No venues match your filters
                  </Typography>
                </Box>
              ) : (
                filteredVenues.map((venue) => (
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
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : theme.palette.background.paper,
                        boxShadow: isDark
                          ? 'none'
                          : '0 2px 8px rgba(0,0,0,0.06)',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.02)',
                        },
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
                          {venue.cuisineType} &middot; {venue.locationText}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          flexShrink: 0,
                        }}
                      >
                        <StarIcon
                          sx={{
                            fontSize: 16,
                            color: theme.palette.primary.main,
                          }}
                        />
                        <Typography
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          {Number(venue.rating).toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Link>
                ))
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
