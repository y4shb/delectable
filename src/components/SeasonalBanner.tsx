import React from 'react';
import { Box, Typography, Chip, Skeleton, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useSeasonalHighlights } from '../hooks/useApi';

const SEASON_THEMES: Record<string, { gradient: string; accent: string; label: string }> = {
  spring: { gradient: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)', accent: '#2e7d32', label: 'Spring Specials' },
  summer: { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', accent: '#e65100', label: 'Summer Picks' },
  fall: { gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)', accent: '#bf360c', label: 'Fall Favorites' },
  winter: { gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', accent: '#1565c0', label: 'Winter Warmers' },
};

export default function SeasonalBanner() {
  const { data, isLoading } = useSeasonalHighlights();
  const router = useRouter();
  const muiTheme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 1.5 }}>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" width={160} height={200} sx={{ borderRadius: 2, flexShrink: 0 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data || !data.data || data.data.length === 0) return null;

  const theme = SEASON_THEMES[data.season] || SEASON_THEMES.spring;

  return (
    <Box sx={{ py: 1.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.accent, fontSize: '1.05rem' }}>
          {theme.label}
        </Typography>
        <Chip
          label="Limited time"
          size="small"
          sx={{ background: theme.gradient, color: theme.accent, fontWeight: 600, fontSize: '0.65rem', height: 20 }}
        />
      </Box>

      {/* Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          px: 2,
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {data.data.map((h) => (
          <Box
            key={h.id}
            onClick={() => h.venueDetail?.id && router.push(`/venue/${h.venueDetail.id}`)}
            sx={{
              width: 160,
              minWidth: 160,
              flexShrink: 0,
              cursor: 'pointer',
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: muiTheme.palette.background.paper,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              component="img"
              src={h.photoUrl || h.venueDetail?.photoUrl || '/placeholder-food.jpg'}
              alt={h.dishName}
              sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
            />
            <Box sx={{ p: 1.25 }}>
              <Typography
                fontWeight={700}
                sx={{ fontSize: '0.82rem', lineHeight: 1.3, mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {h.dishName}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {h.venueDetail?.name}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
