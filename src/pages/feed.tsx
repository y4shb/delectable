import AppShell from '../layouts/AppShell';
import { Box, Typography, Stack } from '@mui/material';

export default function FeedPage() {
  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Feed
      </Typography>
      <Stack spacing={2}>
        {/* Placeholder cards for playlists and reviews */}
        {[1,2,3].map(i => (
          <Box key={i} sx={{ bgcolor: 'background.paper', borderRadius: 4, p: 2, boxShadow: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Playlist/Review Card {i}</Typography>
            <Typography variant="body2" color="text.secondary">Sample description or review text goes here.</Typography>
          </Box>
        ))}
      </Stack>
    </AppShell>
  );
}
