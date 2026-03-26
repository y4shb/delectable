import React from 'react';
import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import {
  WbSunny as SunIcon,
  Thunderstorm as RainIcon,
  AcUnit as ColdIcon,
  WbCloudy as NiceIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useWeatherRecommendations } from '../hooks/useApi';

const WEATHER_CONFIG: Record<string, { icon: React.ReactNode; bgColor: string; textColor: string }> = {
  rain: { icon: <RainIcon sx={{ fontSize: 18 }} />, bgColor: 'rgba(66, 133, 244, 0.06)', textColor: '#1565c0' },
  cold: { icon: <ColdIcon sx={{ fontSize: 18 }} />, bgColor: 'rgba(66, 133, 244, 0.06)', textColor: '#1565c0' },
  hot: { icon: <SunIcon sx={{ fontSize: 18 }} />, bgColor: 'rgba(255, 152, 0, 0.06)', textColor: '#e65100' },
  nice: { icon: <NiceIcon sx={{ fontSize: 18 }} />, bgColor: 'rgba(76, 175, 80, 0.06)', textColor: '#2e7d32' },
};

interface WeatherBannerProps {
  condition?: string;
}

export default function WeatherBanner({ condition = 'nice' }: WeatherBannerProps) {
  const { data, isLoading } = useWeatherRecommendations(condition);
  const router = useRouter();
  const config = WEATHER_CONFIG[condition] || WEATHER_CONFIG.nice;
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Skeleton variant="text" width={220} height={24} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" width={120} height={150} sx={{ borderRadius: 2, flexShrink: 0 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data || !data.data || data.data.length === 0) return null;

  return (
    <Box sx={{ py: 1.5, background: config.bgColor }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, px: 2 }}>
        <Box sx={{ color: config.textColor, display: 'flex', alignItems: 'center' }}>{config.icon}</Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: config.textColor, fontSize: '0.85rem' }}>
          {data.message}
        </Typography>
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
        {data.data.map((venue) => (
          <Box
            key={venue.id}
            onClick={() => router.push(`/venue/${venue.id}`)}
            sx={{
              width: 120,
              minWidth: 120,
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              component="img"
              src={venue.photoUrl || '/placeholder-venue.jpg'}
              alt={venue.name}
              sx={{
                width: '100%',
                height: 90,
                objectFit: 'cover',
                borderRadius: '10px',
                display: 'block',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Box sx={{ mt: 0.75 }}>
              <Typography
                fontWeight={700}
                sx={{ fontSize: '0.78rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {venue.name}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {venue.cuisineType}
              </Typography>
              {venue.rating > 0 && (
                <Typography fontWeight={700} sx={{ color: config.textColor, fontSize: '0.75rem', mt: 0.25 }}>
                  {Number(venue.rating).toFixed(1)}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
