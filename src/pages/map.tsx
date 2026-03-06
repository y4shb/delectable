import dynamic from 'next/dynamic';
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
  Button,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import StarIcon from '@mui/icons-material/Star';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import PeopleIcon from '@mui/icons-material/People';
import TuneIcon from '@mui/icons-material/Tune';
const GoogleMapView = dynamic(() => import('../components/GoogleMapView'), {
  ssr: false,
  loading: () => <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
});
import VenuePreviewSheet from '../components/VenuePreviewSheet';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useVenues, useFriendsVenues } from '../hooks/useApi';
import Link from 'next/link';
import { Venue } from '../types';

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

const RATING_OPTIONS = [
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

export default function MapPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: friendsVenues } = useFriendsVenues();

  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null);

  // Ref to hold pending map bounds before user clicks "Search this area"
  const pendingBoundsRef = useRef<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null);

  // Temp state for filter panel (apply on confirm)
  const [tempRating, setTempRating] = useState<number | undefined>(undefined);
  const [tempRadiusKm, setTempRadiusKm] = useState<number | null>(null);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempSortBy, setTempSortBy] = useState<string>('rating');

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

  const getDistance = useCallback((lat: number, lng: number) => {
    if (!userLocation || userLocation.lat == null || userLocation.lng == null) return 0;
    const R = 6371;
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

  // Filter and sort venues
  const filteredVenues = useMemo(() => {
    let result = allVenues.filter((v) => {
      if (cuisineFilter && v.cuisineType !== cuisineFilter) return false;
      if (minRating != null && v.rating < minRating) return false;
      if (radiusKm != null && userLocation && v.latitude != null && v.longitude != null) {
        const dist = getDistance(v.latitude, v.longitude);
        if (dist > radiusKm) return false;
      }
      if (selectedTags.length > 0 && v.tags) {
        const hasMatch = selectedTags.some((tag) =>
          v.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatch) return false;
      }
      // Bounding box filter (client-side, matching backend bbox pattern)
      if (mapBounds && v.latitude != null && v.longitude != null) {
        if (
          v.latitude < mapBounds.sw.lat ||
          v.latitude > mapBounds.ne.lat ||
          v.longitude < mapBounds.sw.lng ||
          v.longitude > mapBounds.ne.lng
        ) {
          return false;
        }
      }
      return true;
    });

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
  }, [allVenues, cuisineFilter, minRating, radiusKm, selectedTags, sortBy, getDistance, userLocation, mapBounds]);

  // Active filter pills data
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];
    if (minRating != null) {
      filters.push({
        key: 'rating',
        label: `${minRating}+ \u2605`,
        onRemove: () => setMinRating(undefined),
      });
    }
    if (radiusKm != null) {
      filters.push({
        key: 'radius',
        label: `${radiusKm}km`,
        onRemove: () => setRadiusKm(null),
      });
    }
    selectedTags.forEach((tag) => {
      filters.push({
        key: `tag-${tag}`,
        label: tag,
        onRemove: () => setSelectedTags((prev) => prev.filter((t) => t !== tag)),
      });
    });
    if (sortBy !== 'rating') {
      const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy;
      filters.push({
        key: 'sort',
        label: sortLabel,
        onRemove: () => setSortBy('rating'),
      });
    }
    return filters;
  }, [minRating, radiusKm, selectedTags, sortBy]);

  const handleBoundsChanged = useCallback((bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    setShowSearchThisArea(true);
    pendingBoundsRef.current = bounds;
  }, []);

  const handleSearchThisArea = useCallback(() => {
    if (pendingBoundsRef.current) {
      setMapBounds(pendingBoundsRef.current);
      pendingBoundsRef.current = null;
    }
    setShowSearchThisArea(false);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const handleOpenFilterPanel = useCallback(() => {
    setTempRating(minRating);
    setTempRadiusKm(radiusKm);
    setTempTags([...selectedTags]);
    setTempSortBy(sortBy);
    setShowFilterPanel(true);
  }, [minRating, radiusKm, selectedTags, sortBy]);

  const handleApplyFilters = useCallback(() => {
    setMinRating(tempRating);
    setRadiusKm(tempRadiusKm);
    setSelectedTags(tempTags);
    setSortBy(tempSortBy);
    setShowFilterPanel(false);
  }, [tempRating, tempRadiusKm, tempTags, tempSortBy]);

  const handleResetFilters = useCallback(() => {
    setTempRating(undefined);
    setTempRadiusKm(null);
    setTempTags([]);
    setTempSortBy('rating');
  }, []);

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
          {/* Top row: Cuisine chips */}
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
            </Box>
          </Box>

          {/* Bottom row: Active filter pills + action icons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 0.75,
              maxWidth: 600,
              mx: 'auto',
              px: 0.5,
            }}
          >
            {/* Filters button */}
            <Chip
              icon={<TuneIcon sx={{ fontSize: 16 }} />}
              label="Filters"
              size="small"
              onClick={handleOpenFilterPanel}
              sx={{
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: 12,
                flexShrink: 0,
                bgcolor: activeFilters.length > 0
                  ? theme.palette.primary.main
                  : isDark
                    ? 'rgba(0,0,0,0.6)'
                    : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                color: activeFilters.length > 0 ? '#fff' : theme.palette.text.primary,
                '& .MuiChip-icon': {
                  color: activeFilters.length > 0 ? '#fff' : theme.palette.text.secondary,
                },
                '&:hover': {
                  bgcolor: activeFilters.length > 0
                    ? theme.palette.primary.dark
                    : isDark
                      ? 'rgba(0,0,0,0.7)'
                      : 'rgba(255,255,255,0.95)',
                },
              }}
            />

            {/* Active filter pills (scrollable) */}
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flex: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {activeFilters.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  size="small"
                  onDelete={f.onRemove}
                  deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: 11,
                    flexShrink: 0,
                    height: 28,
                    bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                    backdropFilter: 'blur(8px)',
                    color: theme.palette.text.primary,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.text.secondary,
                      fontSize: 14,
                    },
                  }}
                />
              ))}
            </Box>

            {/* Action icons: Sort, View toggle, More */}
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  color: sortBy !== 'rating'
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(8px)',
                  width: 32,
                  height: 32,
                }}
                aria-label="Sort venues"
              >
                <SortIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                sx={{
                  color: theme.palette.text.secondary,
                  bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(8px)',
                  width: 32,
                  height: 32,
                }}
                aria-label={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
              >
                {viewMode === 'map' ? <ViewListIcon sx={{ fontSize: 18 }} /> : <MapIcon sx={{ fontSize: 18 }} />}
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                sx={{
                  color: (heatmapMode || showFriends)
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(8px)',
                  width: 32,
                  height: 32,
                }}
                aria-label="More options"
              >
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Venue count indicator */}
          <Box
            sx={{
              mt: 0.75,
              maxWidth: 600,
              mx: 'auto',
              px: 0.5,
            }}
          >
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                transition: 'opacity 0.2s ease',
              }}
            >
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {filteredVenues.length === 0 ? (
                  'No venues match your filters'
                ) : (
                  <>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {filteredVenues.length}
                    </Box>{' '}
                    {filteredVenues.length === 1 ? 'venue' : 'venues'}
                  </>
                )}
              </Typography>
            </Box>
          </Box>

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

          {/* More menu (Heatmap, Friends) */}
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={() => setMoreMenuAnchor(null)}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                mt: 1,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setHeatmapMode((p) => !p);
                setMoreMenuAnchor(null);
              }}
            >
              <ThermostatIcon sx={{ fontSize: 20, mr: 1, color: heatmapMode ? theme.palette.primary.main : 'text.secondary' }} />
              {heatmapMode ? 'Hide Heatmap' : 'Show Heatmap'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setShowFriends((p) => !p);
                setMoreMenuAnchor(null);
              }}
            >
              <PeopleIcon sx={{ fontSize: 20, mr: 1, color: showFriends ? theme.palette.primary.main : 'text.secondary' }} />
              {showFriends ? 'Hide Friends' : 'Show Friends'}
            </MenuItem>
          </Menu>
        </Box>

        {/* "Search this area" button */}
        {showSearchThisArea && viewMode === 'map' && (
          <Box
            sx={{
              position: 'absolute',
              top: 200,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
            }}
          >
            <Button
              variant="contained"
              disableElevation
              onClick={handleSearchThisArea}
              startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 13,
                px: 2.5,
                py: 0.75,
                bgcolor: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)',
                color: theme.palette.primary.main,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(40,40,40,0.95)' : '#fff',
                },
              }}
            >
              Search this area
            </Button>
          </Box>
        )}

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
              venues={filteredVenues}
              cuisineFilter={cuisineFilter}
              minRating={minRating}
              heatmapMode={heatmapMode}
              friendsVenues={showFriends ? friendsVenues : undefined}
              radiusKm={radiusKm}
              userLocation={userLocation}
              enableClustering={filteredVenues.length > 10}
              onVenueSelect={handleVenueSelect}
              onBoundsChanged={handleBoundsChanged}
            />

            {/* Venue preview bottom sheet */}
            <VenuePreviewSheet
              venue={selectedVenue}
              onDismiss={() => setSelectedVenue(null)}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              pt: 22,
              pb: 12,
              px: 2,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {filteredVenues.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Typography color="text.secondary" sx={{ fontSize: 16 }}>
                  No venues match your filters
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                  maxWidth: 700,
                  mx: 'auto',
                }}
              >
                {filteredVenues.map((venue) => (
                  <Link
                    key={venue.id}
                    href={`/venue/${venue.id}`}
                    legacyBehavior
                    passHref
                  >
                    <Box
                      component="a"
                      sx={{
                        display: 'block',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : theme.palette.background.paper,
                        boxShadow: isDark
                          ? 'none'
                          : '0 2px 12px rgba(0,0,0,0.08)',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: isDark
                            ? '0 4px 16px rgba(0,0,0,0.3)'
                            : '0 4px 20px rgba(0,0,0,0.12)',
                        },
                      }}
                    >
                      {/* Venue photo */}
                      {venue.photoUrl && (
                        <Box
                          component="img"
                          src={venue.photoUrl}
                          alt={venue.name}
                          sx={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Content */}
                      <Box sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                            {venue.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.25,
                              flexShrink: 0,
                            }}
                          >
                            <StarIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: 14 }}>
                              {Number(venue.rating).toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.25 }}>
                          {venue.cuisineType} &middot; {venue.locationText}
                        </Typography>

                        {/* Review count + distance */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          {venue.reviewsCount > 0 && (
                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                              {venue.reviewsCount} {venue.reviewsCount === 1 ? 'review' : 'reviews'}
                            </Typography>
                          )}
                          {userLocation && venue.latitude != null && venue.longitude != null && (
                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                              {getDistance(venue.latitude, venue.longitude).toFixed(1)} km away
                            </Typography>
                          )}
                        </Box>

                        {/* Tags */}
                        {venue.tags && venue.tags.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                            {venue.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: '8px',
                                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                  color: 'text.secondary',
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Link>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Unified filter panel (half-screen overlay) */}
        {showFilterPanel && (
          <>
            {/* Backdrop */}
            <Box
              onClick={() => setShowFilterPanel(false)}
              sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            {/* Filter sheet */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 101,
                maxHeight: '60vh',
                bgcolor: isDark ? '#1a1a1a' : '#fff',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {/* Handle bar */}
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 1 }}>
                <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }} />
              </Box>

              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pb: 1 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Filters</Typography>
                <Button
                  size="small"
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none', fontSize: 13, color: theme.palette.primary.main }}
                >
                  Reset
                </Button>
              </Box>

              <Box sx={{ px: 3, pb: 3 }}>
                {/* Rating section */}
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, mt: 1 }}>Rating</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {RATING_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      size="small"
                      icon={<StarIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setTempRating(tempRating === opt.value ? undefined : opt.value)}
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: 13,
                        bgcolor: tempRating === opt.value
                          ? theme.palette.primary.main
                          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        color: tempRating === opt.value ? '#fff' : theme.palette.text.primary,
                        '& .MuiChip-icon': {
                          color: tempRating === opt.value ? '#fff' : theme.palette.text.secondary,
                        },
                        '&:hover': {
                          bgcolor: tempRating === opt.value
                            ? theme.palette.primary.dark
                            : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        },
                      }}
                    />
                  ))}
                </Box>

                {/* Distance section */}
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, mt: 2.5 }}>
                  Distance: {tempRadiusKm ? `${tempRadiusKm} km` : 'Any'}
                </Typography>
                <Slider
                  value={tempRadiusKm ?? 0}
                  onChange={(_, v) => setTempRadiusKm(v === 0 ? null : (v as number))}
                  min={0}
                  max={20}
                  step={1}
                  marks={[
                    { value: 0, label: 'Any' },
                    { value: 5, label: '5km' },
                    { value: 10, label: '10km' },
                    { value: 20, label: '20km' },
                  ]}
                  sx={{ color: theme.palette.primary.main, mx: 1 }}
                />

                {/* Tags section */}
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, mt: 2 }}>Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {TAG_OPTIONS.map((tag) => {
                    const isActive = tempTags.includes(tag);
                    return (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => {
                          setTempTags((prev) =>
                            isActive ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                        }}
                        sx={{
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: 12,
                          bgcolor: isActive
                            ? theme.palette.primary.main
                            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                          color: isActive ? '#fff' : theme.palette.text.primary,
                          '&:hover': {
                            bgcolor: isActive
                              ? theme.palette.primary.dark
                              : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                          },
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Sort section */}
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, mt: 2.5 }}>Sort by</Typography>
                <Stack spacing={0.5}>
                  {SORT_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      size="small"
                      onClick={() => setTempSortBy(opt.value)}
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: 13,
                        justifyContent: 'flex-start',
                        bgcolor: tempSortBy === opt.value
                          ? theme.palette.primary.main
                          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        color: tempSortBy === opt.value ? '#fff' : theme.palette.text.primary,
                        '&:hover': {
                          bgcolor: tempSortBy === opt.value
                            ? theme.palette.primary.dark
                            : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        },
                      }}
                    />
                  ))}
                </Stack>

                {/* Apply button */}
                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  onClick={handleApplyFilters}
                  sx={{
                    mt: 3,
                    mb: 1,
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 15,
                    py: 1.25,
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>
          </>
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
