import React, { useState } from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Skeleton, Chip } from '@mui/material';
import {
  WbSunny as SunIcon,
  Thunderstorm as RainIcon,
  AcUnit as ColdIcon,
  WbCloudy as NiceIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useWeatherRecommendations } from '../hooks/useApi';

const WEATHER_CONFIG: Record<
  string,
  { icon: React.ReactNode; bgColor: string; textColor: string }
> = {
  rain: {
    icon: <RainIcon sx={{ fontSize: 20 }} />,
    bgColor: 'rgba(66, 133, 244, 0.08)',
    textColor: '#1565c0',
  },
  cold: {
    icon: <ColdIcon sx={{ fontSize: 20 }} />,
    bgColor: 'rgba(66, 133, 244, 0.08)',
    textColor: '#1565c0',
  },
  hot: {
    icon: <SunIcon sx={{ fontSize: 20 }} />,
    bgColor: 'rgba(255, 152, 0, 0.08)',
    textColor: '#e65100',
  },
  nice: {
    icon: <NiceIcon sx={{ fontSize: 20 }} />,
    bgColor: 'rgba(76, 175, 80, 0.08)',
    textColor: '#2e7d32',
  },
};

interface WeatherBannerProps {
  condition?: string;
}

export default function WeatherBanner({ condition = 'nice' }: WeatherBannerProps) {
  const { data, isLoading } = useWeatherRecommendations(condition);
  const router = useRouter();
  const config = WEATHER_CONFIG[condition] || WEATHER_CONFIG.nice;

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 1.5 }}>
        <Skeleton variant="text" width={260} height={28} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={160}
              height={180}
              sx={{ borderRadius: 2, flexShrink: 0 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        mx: -2,
        background: config.bgColor,
        borderRadius: 0,
      }}
    >
      {/* Banner header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 2 }}>
        <Box sx={{ color: config.textColor, display: 'flex', alignItems: 'center' }}>
          {config.icon}
        </Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ color: config.textColor }}
        >
          {data.message}
        </Typography>
      </Box>

      {/* Horizontal scroll of venue cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 0.5,
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          px: 2,
        }}
      >
        {data.data.map((venue) => (
          <Card
            key={venue.id}
            onClick={() => router.push(`/venue/${venue.id}`)}
            sx={{
              width: 160,
              minWidth: 160,
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardMedia
              component="img"
              height={100}
              image={venue.photoUrl || '/placeholder-venue.jpg'}
              alt={venue.name}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="caption" fontWeight={700} noWrap display="block">
                {venue.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {venue.cuisineType}
              </Typography>
              {venue.rating > 0 && (
                <Chip
                  label={String(venue.rating)}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: config.bgColor,
                    color: config.textColor,
                  }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
