import AppShell from '../layouts/AppShell';
import {
  Box,
  Chip,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  Slider,
  TextField,
  Autocomplete,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import StarIcon from '@mui/icons-material/Star';
import SortIcon from '@mui/icons-material/Sort';
import RadiusIcon from '@mui/icons-material/RadioButtonChecked';
import SearchIcon from '@mui/icons-material/Search';
import GoogleMapView from '../components/GoogleMapView';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useVenues, useFriendsVenues } from '../hooks/useApi';
import Link from 'next/link';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import PeopleIcon from '@mui/icons-material/People';

const CUISINE_OPTIONS = ['Japanese', 'Italian', 'American', 'European', 'Experimental'];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating (High to Low)' },
  { value: 'recency', label: 'Most Recent' },
  { value: 'reviews', label: 'Most Reviews' },
];

const TAG_OPTIONS = [
  'Date Night', 'Family Friendly', 'Outdoor Seating', 'Late Night',
  'Brunch', 'Happy Hour', 'Vegan Options', 'Healthy', 'Cozy',
  'Trendy', 'Rooftop', 'Live Music', 'Pet Friendly', 'Romantic',
];

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
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [showRadiusSlider, setShowRadiusSlider] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Default location (Connaught Place, New Delhi)
  const DEFAULT_LOCATION = { lat: 28.6304, lng: 77.2177 };

  // Get user location for distance sorting/filtering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Use default center if geolocation denied
          setUserLocation(DEFAULT_LOCATION);
          setLocationDenied(true);
        },
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
    }
  }, []);

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

  // Calculate distance from user location - must be before any conditional returns
  const getDistance = useCallback((lat: number, lng: number) => {
    if (!userLocation || userLocation.lat == null || userLocation.lng == null) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [userLocation]);

  const allVenues = venues ?? [];

  // Filter and sort venues - must be before any conditional returns
  const filteredVenues = useMemo(() => {
    let result = allVenues.filter((v) => {
      if (cuisineFilter && v.cuisineType !== cuisineFilter) return false;
      if (minRating != null && v.rating < minRating) return false;
      // Radius filter
      if (radiusKm != null && userLocation && v.latitude != null && v.longitude != null) {
        const dist = getDistance(v.latitude, v.longitude);
        if (dist > radiusKm) return false;
      }
      // Tag filter
      if (tagFilter && v.tags && !v.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) {
        return false;
      }
      return true;
    });

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'recency') {
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'reviews') {
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return result;
  }, [allVenues, cuisineFilter, minRating, radiusKm, tagFilter, sortBy, getDistance, userLocation]);

  if (authLoading || venuesLoading) {
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

              {/* Radius filter chip */}
              <Chip
                label={radiusKm ? `${radiusKm}km` : 'Radius'}
                size="small"
                icon={<RadiusIcon sx={{ fontSize: 14 }} />}
                onClick={() => setShowRadiusSlider(!showRadiusSlider)}
                sx={{
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: 12,
                  flexShrink: 0,
                  bgcolor: radiusKm
                    ? theme.palette.primary.main
                    : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                  color: radiusKm ? '#fff' : theme.palette.text.primary,
                  '& .MuiChip-icon': {
                    color: radiusKm ? '#fff' : theme.palette.text.secondary,
                  },
                  '&:hover': {
                    bgcolor: radiusKm
                      ? theme.palette.primary.dark
                      : isDark
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(0,0,0,0.1)',
                  },
                }}
              />

              {/* Tag filter chip */}
              {tagFilter && (
                <Chip
                  label={tagFilter}
                  size="small"
                  onDelete={() => setTagFilter(null)}
                  sx={{
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                  }}
                />
              )}
            </Box>

            {/* Search, Sort, Map/List toggles */}
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => setShowTagSearch(!showTagSearch)}
                sx={{
                  color: showTagSearch || tagFilter
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
                aria-label="Search by tag"
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  color: sortBy !== 'rating'
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
                aria-label="Sort venues"
              >
                <SortIcon sx={{ fontSize: 20 }} />
              </IconButton>
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

          {/* Radius slider overlay */}
          {showRadiusSlider && (
            <Box
              sx={{
                mt: 1,
                bgcolor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                px: 3,
                py: 1.5,
                maxWidth: 300,
                mx: 'auto',
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                Search Radius: {radiusKm ? `${radiusKm} km` : 'Any'}
              </Typography>
              <Slider
                value={radiusKm ?? 0}
                onChange={(_, v) => setRadiusKm(v === 0 ? null : (v as number))}
                min={0}
                max={20}
                step={1}
                marks={[
                  { value: 0, label: 'Any' },
                  { value: 5, label: '5km' },
                  { value: 10, label: '10km' },
                  { value: 20, label: '20km' },
                ]}
                sx={{ color: theme.palette.primary.main }}
              />
            </Box>
          )}

          {/* Tag search overlay */}
          {showTagSearch && (
            <Box
              sx={{
                mt: 1,
                bgcolor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                px: 2,
                py: 1.5,
                maxWidth: 300,
                mx: 'auto',
              }}
            >
              <Autocomplete
                options={TAG_OPTIONS}
                value={tagFilter}
                onChange={(_, v) => {
                  setTagFilter(v);
                  setShowTagSearch(false);
                }}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by tag..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        fontSize: 14,
                      },
                    }}
                  />
                )}
              />
            </Box>
          )}

          {/* Sort menu */}
          <Menu
            anchorEl={sortMenuAnchor}
            open={Boolean(sortMenuAnchor)}
            onClose={() => setSortMenuAnchor(null)}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                mt: 1,
              },
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={sortBy === opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  setSortMenuAnchor(null);
                }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Menu>
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
              radiusKm={radiusKm}
              userLocation={userLocation}
              enableClustering={filteredVenues.length > 10}
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

      {/* Geolocation denied notice */}
      <Snackbar
        open={locationDenied}
        autoHideDuration={6000}
        onClose={() => setLocationDenied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setLocationDenied(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          Location access denied. Showing default location (New Delhi).
        </Alert>
      </Snackbar>
    </AppShell>
  );
}
