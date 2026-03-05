import React, { useCallback, useRef, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { useTheme, Box, Typography, IconButton, Fab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Link from 'next/link';
import { Venue, FriendsVenue } from '../types';

const MAPS_LIBRARIES: ('visualization')[] = ['visualization'];

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 8,
  overflow: 'hidden',
};

const defaultCenter = {
  lat: 28.6304,
  lng: 77.2177,
}; // Connaught Place, New Delhi

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#64779e" }] },
  { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e87" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#023e58" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d6a" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] },
  { "featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#023e58" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#3C7680" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
  { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0d5ce" }] },
  { "featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{ "color": "#023e58" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
  { "featureType": "transit", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
  { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#283d6a" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#3a4762" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d70" }] }
];

/** CSS overrides injected once to strip Google's default InfoWindow chrome */
const infoWindowStyleOverride = `
  .gm-style-iw {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }
  .gm-style-iw-d {
    overflow: visible !important;
    padding: 0 !important;
  }
  .gm-style-iw-tc {
    display: none !important;
  }
  /* Hide Google's default close button — we render our own */
  .gm-style-iw > button,
  .gm-ui-hover-effect {
    display: none !important;
  }
`;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/** Build an SVG data URL for a map pin marker with an embedded icon glyph */
function getMarkerIcon(cuisine: string, isDark: boolean): { url: string; scaledSize: google.maps.Size } {
  const colorMap: Record<string, { fill: string; glyph: string }> = {
    Japanese:     { fill: '#E8654A', glyph: '\uD83C\uDF63' },
    Italian:      { fill: '#D64545', glyph: '\uD83C\uDF55' },
    American:     { fill: '#E6A817', glyph: '\uD83C\uDF54' },
    European:     { fill: '#D4A843', glyph: '\uD83E\uDD50' },
    Experimental: { fill: '#2B9E8F', glyph: '\uD83E\uDDEA' },
  };

  const entry = colorMap[cuisine] || { fill: '#E8654A', glyph: '\uD83C\uDF74' };
  const pinColor = entry.fill;
  const glyph = entry.glyph;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <defs>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M20 38 C20 38 6 24 6 16 C6 8.268 12.268 2 20 2 C27.732 2 34 8.268 34 16 C34 24 20 38 20 38Z"
          fill="${pinColor}" stroke="${isDark ? '#fff' : '#333'}" stroke-width="1" filter="url(#s)"/>
    <circle cx="20" cy="16" r="9" fill="#fff" opacity="0.9"/>
    <text x="20" y="20" text-anchor="middle" font-size="13">${glyph}</text>
  </svg>`;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return { url, scaledSize: new window.google.maps.Size(40, 40) };
}

/** Blue dot SVG for user's current location */
function getUserLocationIcon(): { url: string; scaledSize: google.maps.Size } {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="rgba(66,133,244,0.2)" stroke="none"/>
    <circle cx="12" cy="12" r="6" fill="#4285F4" stroke="#fff" stroke-width="2"/>
  </svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return { url, scaledSize: new window.google.maps.Size(24, 24) };
}

export interface GoogleMapViewProps {
  venues: Venue[];
  cuisineFilter?: string | null;
  minRating?: number;
  heatmapMode?: boolean;
  friendsVenues?: FriendsVenue[];
}

export default function GoogleMapView({ venues, cuisineFilter, minRating, heatmapMode, friendsVenues }: GoogleMapViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Filter venues: must have lat/lng, and respect cuisine / rating filters
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (v.latitude == null || v.longitude == null) return false;
      if (cuisineFilter && v.cuisineType !== cuisineFilter) return false;
      if (minRating != null && v.rating < minRating) return false;
      return true;
    });
  }, [venues, cuisineFilter, minRating]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const options = useMemo(() => ({
    styles: isDark ? darkMapStyle : undefined,
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    clickableIcons: true,
  }), [isDark]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (mapRef.current) {
          mapRef.current.panTo(loc);
        }
      },
      () => {
        // Geolocation denied or unavailable — silently ignore
      },
    );
  }, []);

  return isLoaded ? (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Inject InfoWindow style overrides */}
      <style>{infoWindowStyleOverride}</style>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        options={options}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {filteredVenues.map((venue) => (
          <Marker
            key={venue.id}
            position={{ lat: venue.latitude, lng: venue.longitude }}
            icon={getMarkerIcon(venue.cuisineType, isDark)}
            onClick={() => setSelectedVenue(venue)}
          />
        ))}

        {/* Heatmap layer */}
        {heatmapMode && isLoaded && (
          <HeatmapLayer
            data={filteredVenues
              .filter((v) => v.latitude != null && v.longitude != null)
              .map((v) => ({
                location: new window.google.maps.LatLng(v.latitude, v.longitude),
                weight: v.reviewsCount || 1,
              }))}
            options={{
              radius: 40,
              opacity: 0.7,
            }}
          />
        )}

        {/* Friends venue markers */}
        {friendsVenues?.map((fv) =>
          fv.latitude != null && fv.longitude != null ? (
            <Marker
              key={`friend-${fv.id}`}
              position={{ lat: fv.latitude, lng: fv.longitude }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="12" fill="#009688" stroke="#fff" stroke-width="2"/>
                    <text x="14" y="18" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold" font-family="Arial">${(fv.friendAvatars?.[0]?.name ?? 'F').charAt(0)}</text>
                  </svg>`
                )}`,
                scaledSize: new window.google.maps.Size(28, 28),
              }}
              onClick={() => setSelectedVenue(fv)}
              zIndex={500}
            />
          ) : null,
        )}

        {/* User location blue dot */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={getUserLocationIcon()}
            clickable={false}
            zIndex={999}
          />
        )}

        {selectedVenue && selectedVenue.latitude != null && selectedVenue.longitude != null && (
          <InfoWindow
            position={{ lat: selectedVenue.latitude, lng: selectedVenue.longitude }}
            onCloseClick={() => setSelectedVenue(null)}
            options={{ disableAutoPan: false, pixelOffset: new window.google.maps.Size(0, -10) }}
          >
            <Link href={`/venue/${selectedVenue.id}`} passHref legacyBehavior>
              <Box
                component="a"
                sx={{
                  display: 'block',
                  width: 220,
                  bgcolor: 'background.paper',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  position: 'relative',
                  p: 0,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Close button */}
                <IconButton
                  size="small"
                  aria-label="Close venue info"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVenue(null);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    zIndex: 2,
                    bgcolor: 'rgba(0,0,0,0.45)',
                    color: '#fff',
                    width: 24,
                    height: 24,
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.65)',
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>

                {/* Venue photo */}
                <Box
                  component="img"
                  src={selectedVenue.photoUrl}
                  alt={selectedVenue.name}
                  sx={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: '16px 16px 0 0',
                    display: 'block',
                  }}
                />

                {/* Content area */}
                <Box sx={{ p: '12px' }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: 'text.primary',
                      lineHeight: 1.3,
                    }}
                  >
                    {selectedVenue.name}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: 'text.secondary',
                      mt: 0.25,
                    }}
                  >
                    {selectedVenue.cuisineType}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                      mt: 0.5,
                    }}
                  >
                    {'\u2605'} {selectedVenue.rating}
                  </Typography>
                </Box>
              </Box>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* My Location FAB */}
      <Fab
        size="small"
        onClick={handleMyLocation}
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 16,
          zIndex: 10,
          bgcolor: 'background.paper',
          color: 'primary.main',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          '&:hover': {
            bgcolor: 'background.paper',
          },
        }}
        aria-label="My location"
      >
        <MyLocationIcon />
      </Fab>
    </Box>
  ) : null;
}
