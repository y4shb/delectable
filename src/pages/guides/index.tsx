import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  InputAdornment,
  Typography,
  Alert,
  useTheme,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import AppShell from '../../layouts/AppShell';
import { useFoodGuides } from '../../hooks/useApi';
import type { FoodGuide } from '../../types';

export default function GuidesPage() {
  const theme = useTheme();
  const [cityFilter, setCityFilter] = useState('');
  const trimmedCity = cityFilter.trim() || undefined;
  const { data, isLoading, error } = useFoodGuides(
    trimmedCity ? { city: trimmedCity } : undefined,
  );
  const guides: FoodGuide[] = (data as FoodGuide[] | undefined) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={700} mb={3}>Food Guides</Typography>
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        </Container>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load food guides</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <MenuBookIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight={700}>Food Guides</Typography>
        </Box>

        <Box sx={{ mb: 3, maxWidth: 420 }}>
          <TextField
            fullWidth
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '48px',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              },
            }}
          />
        </Box>

        {guides.length === 0 && (
          <Box textAlign="center" py={8}>
            <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>No food guides found</Typography>
            <Typography color="text.secondary">
              {trimmedCity
                ? `No guides available for "${trimmedCity}" yet.`
                : 'Check back soon for curated city food guides!'}
            </Typography>
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          {guides.map((guide) => (
            <Link key={guide.id} href={`/guides/${guide.id}`} passHref legacyBehavior>
              <Card
                component="a"
                sx={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
                }}
              >
                {guide.coverPhotoUrl && (
                  <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={guide.coverPhotoUrl}
                      alt={guide.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box sx={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
                        {guide.title}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <CardContent sx={{ p: 2.5 }}>
                  {!guide.coverPhotoUrl && (
                    <Typography variant="h6" fontWeight={700} mb={1}>{guide.title}</Typography>
                  )}
                  {guide.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={2}
                      sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {guide.description}
                    </Typography>
                  )}
                  <Stack direction="row" gap={2} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationOnIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {guide.city}{guide.neighborhood ? ` - ${guide.neighborhood}` : ''}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {guide.durationHours}h itinerary
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <VisibilityIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {guide.viewCount} views
                      </Typography>
                    </Box>
                    {guide.stopsCount != null && guide.stopsCount > 0 && (
                      <Chip
                        label={`${guide.stopsCount} stops`}
                        size="small"
                        sx={{ borderRadius: '12px', fontWeight: 600, fontSize: 12, bgcolor: 'rgba(242,77,79,0.1)', color: theme.palette.primary.main }}
                      />
                    )}
                  </Stack>
                  {guide.authorName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                      by {guide.authorName}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </Box>
      </Container>
    </AppShell>
  );
}
