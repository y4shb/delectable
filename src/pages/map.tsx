import AppShell from '../layouts/AppShell';
import { Box, Typography } from '@mui/material';

export default function MapPage() {
  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Map
      </Typography>
      <Box sx={{ width: '100%', height: 550, borderRadius: 1.1, overflow: 'hidden', bgcolor: 'grey.200', mb: 2 }}>
        {/* Static Google Map placeholder */}
        <iframe
          title="map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://maps.google.com/maps?q=Los%20Angeles&t=&z=13&ie=UTF8&iwloc=&output=embed"
          allowFullScreen
        />
      </Box>
    </AppShell>
  );
}
