import React from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Chip, Skeleton } from '@mui/material';
import { useRouter } from 'next/router';
import { useSeasonalHighlights } from '../hooks/useApi';

const SEASON_THEMES: Record<string, { gradient: string; accent: string; label: string }> = {
  spring: {
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
    accent: '#2e7d32',
    label: 'Spring Specials',
  },
  summer: {
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accent: '#e65100',
    label: 'Summer Picks',
  },
  fall: {
    gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)',
    accent: '#bf360c',
    label: 'Fall Favorites',
  },
  winter: {
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    accent: '#1565c0',
    label: 'Winter Warmers',
  },
};

export default function SeasonalBanner() {
  const { data, isLoading } = useSeasonalHighlights();
  const router = useRouter();

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 2 }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={220}
              height={260}
              sx={{ borderRadius: 3, flexShrink: 0 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return null;
  }

  const season = data.season;
  const theme = SEASON_THEMES[season] || SEASON_THEMES.spring;
  const highlights = data.data;

  return (
    <Box sx={{ py: 2, px: 2 }}>
      {/* Section header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: theme.accent }}
        >
          {theme.label}
        </Typography>
        <Chip
          label="Limited time"
          size="small"
          sx={{
            background: theme.gradient,
            color: theme.accent,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 22,
          }}
        />
      </Box>

      {/* Horizontal scroll */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          mx: -2,
          px: 2,
        }}
      >
        {highlights.map((highlight) => (
          <Card
            key={highlight.id}
            onClick={() => {
              if (highlight.venueDetail?.id) {
                router.push(`/venue/${highlight.venueDetail.id}`);
              }
            }}
            sx={{
              width: 220,
              minWidth: 220,
              flexShrink: 0,
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height={140}
                image={highlight.photoUrl || highlight.venueDetail?.photoUrl || '/placeholder-food.jpg'}
                alt={highlight.dishName}
                sx={{ objectFit: 'cover' }}
              />
              <Chip
                label="Seasonal"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: theme.gradient,
                  color: theme.accent,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            </Box>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                noWrap
                sx={{ mb: 0.25 }}
              >
                {highlight.dishName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                display="block"
                sx={{ mb: 0.5 }}
              >
                {highlight.venueDetail?.name}
              </Typography>
              {highlight.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                  }}
                >
                  {highlight.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
