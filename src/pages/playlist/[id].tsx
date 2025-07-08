import AppShell from '../../layouts/AppShell';
import { Box, Typography, Stack, Card, CardMedia, CardContent } from '@mui/material';

export default function PlaylistDetailPage() {
  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Playlist Detail
      </Typography>
      <Stack spacing={2}>
        {[1,2,3].map(i => (
          <Card key={i} sx={{ borderRadius: 4 }}>
            <CardMedia
              component="img"
              height="160"
              image={`/images/food${i}.jpg`}
              alt={`Food ${i}`}
            />
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Dish/Restaurant {i}</Typography>
              <Typography variant="body2" color="text.secondary">Photo caption or description here.</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </AppShell>
  );
}
