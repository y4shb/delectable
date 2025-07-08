import AppShell from '../layouts/AppShell';
import { Box, Typography, Avatar, Stack, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mb: 1 }} src="/images/avatar1.jpg" />
        <Typography variant="h6" fontWeight={700}>Tare Ebimami</Typography>
        <Typography variant="body2" color="text.secondary">1,376 followers · 86 following</Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Reviews" />
            <Tab label="Playlists" />
            <Tab label="Map" />
          </Tabs>
        </Box>
      </Box>
      <Stack spacing={2}>
        {/* Placeholder for reviews/playlists/map */}
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, p: 2, boxShadow: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>Sample Card</Typography>
          <Typography variant="body2" color="text.secondary">Review or playlist preview goes here.</Typography>
        </Box>
      </Stack>
    </AppShell>
  );
}
