import React, { useCallback, useRef, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useTheme } from '@mui/material';
import { mockVenues } from '../api/mockApi';

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

// Assign mock coordinates to venues for demo (New Delhi area)
const venueCoords = [
  { lat: 28.6304, lng: 77.2177 }, // Hibachi - Connaught Place
  { lat: 28.6139, lng: 77.2090 }, // Pizzeria - Central Delhi
];

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

// TODO: Replace with your actual API key or prompt user to add it to .env
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map|null>(null);
  const [visibleVenues, setVisibleVenues] = useState<number[]>([0, 1]);
  const [selectedIdx, setSelectedIdx] = useState<number|null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Initial visible markers
    const bounds = map.getBounds();
    if (bounds) {
      setVisibleVenues(
        venueCoords.map((coord, i) => bounds.contains(coord) ? i : -1).filter(i => i !== -1)
      );
    }
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onIdle = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        setVisibleVenues(
          venueCoords.map((coord, i) => bounds.contains(coord) ? i : -1).filter(i => i !== -1)
        );
      }
    }
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

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={13}
      options={options}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onIdle={onIdle}
    >
      {mockVenues.map((venue, i) => (
        <Marker
          key={venue.id}
          position={venueCoords[i]}
          icon={visibleVenues.includes(i) ? {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(44, 44),
          } : undefined}
          onClick={() => setSelectedIdx(i)}
          opacity={visibleVenues.includes(i) ? 1 : 0.5}
        />
      ))}
      {selectedIdx !== null && (
        <InfoWindow
          position={venueCoords[selectedIdx]}
          onCloseClick={() => setSelectedIdx(null)}
        >
          <div>
            <strong>{mockVenues[selectedIdx].name}</strong><br/>
            {mockVenues[selectedIdx].cuisine} <br/>
            Rating: {mockVenues[selectedIdx].rating}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : null;
}
