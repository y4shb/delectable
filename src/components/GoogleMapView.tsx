import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, HeatmapLayer, Circle } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Box, Fab } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useTheme } from '@mui/material';
import { Venue, FriendsVenue } from '../types';

const MAPS_LIBRARIES: ('visualization')[] = ['visualization'];

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 8,
  overflow: 'hidden',
};

// Default center (Connaught Place, New Delhi) - can be overridden via environment variable
const DEFAULT_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT || '28.6304'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG || '77.2177'),
};

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

/** Light-mode map styling: muted labels, soft grey roads, desaturated POIs — matches warm/peach palette */
const lightMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f1eb" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#6b6560" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#d4cec7" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9689" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#efe9e1" }] },
  { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "color": "#f0ebe3" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#e8e0d5" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a817a" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#d8e8d0" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b8f5b" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#e3ddd5" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a817a" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#ddd5ca" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9bfb3" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b6560" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9689" }] },
  { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#d4cec7" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c8dce8" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#7a9ab0" }] },
];

/** CSS overrides to strip Google's default error banners */
const mapStyleOverride = `
  /* Hide Google Maps error banners and modals */
  .gm-err-container,
  .gm-err-content,
  .gm-err-message,
  .gm-err-title,
  .gm-err-autocomplete,
  .dismissButton,
  .gm-style iframe + div {
    display: none !important;
  }
  /* Hide "This page can't load Google Maps correctly" white banner */
  .gm-style > div > div > div > div > div > a[href*="developers.google.com"],
  .gm-style > div > div > div > div > div > div > a[href*="developers.google.com"] {
    display: none !important;
  }
  /* Hide the bottom-left "For development purposes only" watermark */
  .gmnoprint[style*="z-index: 1000001"],
  div[style*="background-color: white"][style*="z-index"] a[href*="goo.gl"],
  div[style*="background-color: rgb(255, 255, 255)"][style*="position: absolute"][style*="bottom"] {
    display: none !important;
  }
`;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/** Cache for marker icons to avoid recreating SVG data URLs on every render */
const markerIconCache = new Map<string, { url: string; scaledSize: google.maps.Size }>();
let userLocationIconCache: { url: string; scaledSize: google.maps.Size } | null = null;

/** Build an SVG data URL for a map pin marker with an embedded icon glyph */
function getMarkerIcon(cuisine: string, isDark: boolean): { url: string; scaledSize: google.maps.Size } {
  const cacheKey = `${cuisine}-${isDark}`;
  const cached = markerIconCache.get(cacheKey);
  if (cached) return cached;

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
  const icon = { url, scaledSize: new window.google.maps.Size(40, 40) };
  markerIconCache.set(cacheKey, icon);
  return icon;
}

/** Blue dot SVG for user's current location */
function getUserLocationIcon(): { url: string; scaledSize: google.maps.Size } {
  if (userLocationIconCache) return userLocationIconCache;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="rgba(66,133,244,0.2)" stroke="none"/>
    <circle cx="12" cy="12" r="6" fill="#4285F4" stroke="#fff" stroke-width="2"/>
  </svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  userLocationIconCache = { url, scaledSize: new window.google.maps.Size(24, 24) };
  return userLocationIconCache;
}

export interface GoogleMapViewProps {
  venues: Venue[];
  cuisineFilter?: string | null;
  minRating?: number;
  heatmapMode?: boolean;
  friendsVenues?: FriendsVenue[];
  radiusKm?: number | null;
  userLocation?: { lat: number; lng: number } | null;
  enableClustering?: boolean;
  onVenueSelect?: (venue: Venue) => void;
  onBoundsChanged?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void;
}

export default function GoogleMapView({
  venues,
  cuisineFilter,
  minRating,
  heatmapMode,
  friendsVenues,
  radiusKm,
  userLocation: propUserLocation,
  enableClustering = true,
  onVenueSelect,
  onBoundsChanged,
}: GoogleMapViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for auto-fit logic
  const userHasPannedRef = useRef(false);
  const prevVenuesKeyRef = useRef('');
  const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const dragEndListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Use prop user location if provided, otherwise use local
  const userLocation = propUserLocation ?? localUserLocation;

  // Filter venues: must have lat/lng, and respect cuisine / rating filters
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (v.latitude == null || v.longitude == null) return false;
      if (cuisineFilter && v.cuisineType !== cuisineFilter) return false;
      if (minRating != null && v.rating < minRating) return false;
      return true;
    });
  }, [venues, cuisineFilter, minRating]);

  // Strip Google Maps error banners/modals/watermarks after they get injected
  useEffect(() => {
    if (!isLoaded) return;

    const stripErrorElements = () => {
      const roots = [containerRef.current, document.body].filter(Boolean) as HTMLElement[];

      for (const root of roots) {
        root.querySelectorAll<HTMLElement>('.dismissButton').forEach((el) => {
          const modal = el.closest<HTMLElement>('div[style*="z-index"]');
          if (modal) modal.style.display = 'none';
        });
        root.querySelectorAll<HTMLElement>('.gm-err-container').forEach((el) => {
          el.style.display = 'none';
        });
        root.querySelectorAll<HTMLElement>('div[style]').forEach((el) => {
          const style = el.getAttribute('style') || '';
          const text = el.textContent || '';
          if (
            (style.includes('background-color: white') || style.includes('background-color: rgb(255, 255, 255)')) &&
            style.includes('position') &&
            (text.includes('Google Maps') || text.includes('development purposes') || text.includes('developers.google'))
          ) {
            el.style.display = 'none';
          }
        });
        root.querySelectorAll<HTMLElement>('a[href*="developers.google.com/maps"]').forEach((el) => {
          const banner = el.closest<HTMLElement>('div[style*="background"]');
          if (banner) banner.style.display = 'none';
        });
      }
    };

    stripErrorElements();
    const timer1 = setTimeout(stripErrorElements, 500);
    const timer2 = setTimeout(stripErrorElements, 1500);
    const timer3 = setTimeout(stripErrorElements, 3000);

    const observer = new MutationObserver(stripErrorElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    observer.observe(document.body, { childList: true, subtree: false });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [isLoaded]);

  const handleVenueClick = useCallback((venue: Venue) => {
    if (onVenueSelect) {
      onVenueSelect(venue);
    }
  }, [onVenueSelect]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Listen to idle event to detect user pan/zoom
    idleListenerRef.current = map.addListener('idle', () => {
      userHasPannedRef.current = true;
    });

    // Listen to dragend to fire onBoundsChanged
    if (onBoundsChanged) {
      dragEndListenerRef.current = map.addListener('dragend', () => {
        const bounds = map.getBounds();
        if (bounds) {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          onBoundsChanged({
            sw: { lat: sw.lat(), lng: sw.lng() },
            ne: { lat: ne.lat(), lng: ne.lng() },
          });
        }
      });
    }
  }, [onBoundsChanged]);

  const onUnmount = useCallback(() => {
    if (idleListenerRef.current) {
      google.maps.event.removeListener(idleListenerRef.current);
      idleListenerRef.current = null;
    }
    if (dragEndListenerRef.current) {
      google.maps.event.removeListener(dragEndListenerRef.current);
      dragEndListenerRef.current = null;
    }
    mapRef.current = null;
  }, []);

  const options = useMemo(() => ({
    styles: isDark ? darkMapStyle : lightMapStyle,
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
        setLocalUserLocation(loc);
        if (mapRef.current) {
          mapRef.current.panTo(loc);
        }
      },
      () => {
        // Geolocation denied or unavailable
      },
    );
  }, []);

  // Auto-fit bounds to visible markers when filteredVenues changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded || filteredVenues.length === 0) return;

    // Build a key from venue IDs to detect actual filter changes
    const venuesKey = filteredVenues.map((v) => v.id).join(',');
    if (venuesKey === prevVenuesKeyRef.current) return;
    prevVenuesKeyRef.current = venuesKey;

    // Reset user panned flag when filters change
    userHasPannedRef.current = false;

    const bounds = new window.google.maps.LatLngBounds();
    filteredVenues.forEach((v) => {
      if (v.latitude != null && v.longitude != null) {
        bounds.extend({ lat: v.latitude, lng: v.longitude });
      }
    });

    // Only auto-fit if bounds are valid and contain more than one point
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [filteredVenues, isLoaded]);

  // Set up marker clustering with animated entry
  useEffect(() => {
    if (!mapRef.current || !enableClustering || !isLoaded) return;

    // Clear old clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create markers with staggered drop animation
    const markers = filteredVenues.map((venue, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: venue.latitude, lng: venue.longitude },
        icon: getMarkerIcon(venue.cuisineType, isDark),
        animation: null, // Start without animation, add staggered
      });
      marker.addListener('click', () => handleVenueClick(venue));

      // Stagger drop animation: 30ms delay per marker for cascade effect
      setTimeout(() => {
        marker.setAnimation(window.google.maps.Animation.DROP);
      }, index * 30);

      return marker;
    });

    markersRef.current = markers;

    // Create clusterer
    clustererRef.current = new MarkerClusterer({
      map: mapRef.current,
      markers,
      renderer: {
        render: ({ count, position }) => {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="${isDark ? '#E8654A' : '#D64545'}" stroke="#fff" stroke-width="3"/>
            <text x="24" y="28" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold" font-family="Arial">${count}</text>
          </svg>`;
          return new window.google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
              scaledSize: new window.google.maps.Size(48, 48),
            },
            zIndex: 1000,
          });
        },
      },
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [filteredVenues, isLoaded, enableClustering, isDark, handleVenueClick]);

  return isLoaded ? (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Inject style overrides */}
      <style>{mapStyleOverride}</style>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation ?? DEFAULT_CENTER}
        zoom={13}
        options={options}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Render markers only when clustering is disabled */}
        {!enableClustering && filteredVenues.map((venue) => (
          <Marker
            key={venue.id}
            position={{ lat: venue.latitude, lng: venue.longitude }}
            icon={getMarkerIcon(venue.cuisineType, isDark)}
            animation={google.maps.Animation.DROP}
            onClick={() => handleVenueClick(venue)}
          />
        ))}

        {/* Radius circle overlay */}
        {radiusKm && userLocation && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            options={{
              fillColor: isDark ? 'rgba(232, 101, 74, 0.15)' : 'rgba(214, 69, 69, 0.1)',
              fillOpacity: 0.4,
              strokeColor: isDark ? '#E8654A' : '#D64545',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
            }}
          />
        )}

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
              onClick={() => handleVenueClick(fv)}
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
