import AppShell from '../layouts/AppShell';
import { Box, Typography } from '@mui/material';
import GoogleMapView from '../components/GoogleMapView';
import { useEffect } from 'react';

export default function MapPage() {
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);
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
        {/* Map container with blur border */}
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
          <GoogleMapView />
          {/* Blur overlay */}
          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              boxShadow: 'none',
              borderRadius: 0,
            }}
          />
        </Box>
      </Box>
    </AppShell>
  );
}
