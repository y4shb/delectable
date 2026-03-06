import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarIcon from '@mui/icons-material/Star';
import AppShell from '../../layouts/AppShell';
import { useFoodGuideDetail } from '../../hooks/useApi';
import type { GuideStop } from '../../types';

export default function GuideDetailPage() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const { data: guide, isLoading, error } = useFoodGuideDetail(id as string);

  if (!router.isReady || isLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <CircularProgress size={32} />
        </Box>
      </AppShell>
    );
  }

  if (error || !guide) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Guide not found</Typography>
        </Box>
      </AppShell>
    );
  }

  const stops: GuideStop[] = (guide.stops as GuideStop[] | undefined) ?? [];
  const totalTime = stops.reduce((sum, stop) => sum + stop.estimatedTimeMinutes, 0);

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        <Box sx={{ mb: 1, px: 1 }}>
          <IconButton
            onClick={() => router.back()}
            aria-label="Go back"
            sx={{
              width: 40, height: 40, borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {guide.coverPhotoUrl && (
          <Box sx={{ position: 'relative', height: 240, borderRadius: '16px', overflow: 'hidden' }}>
            <Box
              component="img"
              src={guide.coverPhotoUrl}
              alt={guide.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <Box
              sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none',
              }}
            />
          </Box>
        )}

        <Box sx={{ mt: 2, px: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{guide.title}</Typography>
          {guide.authorName && (
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              {guide.authorAvatar && <Avatar src={guide.authorAvatar} sx={{ width: 24, height: 24 }} />}
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>by {guide.authorName}</Typography>
            </Box>
          )}
          <Stack direction="row" gap={1.5} flexWrap="wrap" mt={1.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocationOnIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {guide.city}{guide.neighborhood ? ` - ${guide.neighborhood}` : ''}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {guide.durationHours}h ({totalTime} min total)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <VisibilityIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {guide.viewCount} views
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <BookmarkIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {guide.saveCount} saves
              </Typography>
            </Box>
          </Stack>
          {guide.description && (
            <Typography color="text.secondary" sx={{ fontSize: 15, mt: 2, lineHeight: 1.6 }}>
              {guide.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ px: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
            Itinerary ({stops.length} stops)
          </Typography>
          <Stack spacing={0}>
            {stops.map((stop, index) => (
              <Box key={stop.id} sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: theme.palette.primary.main,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  {index < stops.length - 1 && (
                    <Box
                      sx={{
                        width: 2, flex: 1, my: 0.5,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      }}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    flex: 1, mb: 2.5, borderRadius: '16px', bgcolor: theme.palette.background.paper,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
                  }}
                >
                  <Link href={`/venue/${stop.venueDetail?.id ?? stop.venue}`} passHref legacyBehavior>
                    <Box
                      component="a"
                      sx={{
                        display: 'flex', gap: 1.5, p: 2, textDecoration: 'none', color: 'inherit', cursor: 'pointer',
                        '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
                      }}
                    >
                      {stop.venueDetail?.photoUrl && (
                        <Box
                          component="img"
                          src={stop.venueDetail.photoUrl}
                          alt={stop.venueDetail.name}
                          sx={{ width: 56, height: 56, borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                          {stop.venueDetail?.name ?? 'Venue'}
                        </Typography>
                        {stop.venueDetail?.cuisineType && (
                          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                            {stop.venueDetail.cuisineType}
                          </Typography>
                        )}
                      </Box>
                      {stop.venueDetail?.rating != null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                          <StarIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                          <Typography sx={{ fontWeight: 700, fontSize: 14, color: theme.palette.primary.main }}>
                            {Number(stop.venueDetail.rating).toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Link>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {stop.estimatedTimeMinutes} min
                      </Typography>
                    </Box>
                    {stop.description && (
                      <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1, lineHeight: 1.5 }}>
                        {stop.description}
                      </Typography>
                    )}
                    {stop.recommendedDishes && stop.recommendedDishes.length > 0 && (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 12, mb: 0.5, color: 'text.secondary' }}>
                          Must try:
                        </Typography>
                        <Stack direction="row" gap={0.75} flexWrap="wrap">
                          {stop.recommendedDishes.map((dish: string, i: number) => (
                            <Chip
                              key={i}
                              label={dish}
                              size="small"
                              sx={{ borderRadius: '12px', fontWeight: 600, fontSize: 12, bgcolor: 'rgba(242,77,79,0.1)', color: theme.palette.primary.main }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
          {stops.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">No stops in this guide yet.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </AppShell>
  );
}
