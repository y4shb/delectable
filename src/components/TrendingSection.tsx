import React from 'react';
import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import { useTrendingVenues } from '../hooks/useApi';

function TrendingSection() {
  const theme = useTheme();
  const { data: venues, isLoading } = useTrendingVenues();

  if (isLoading) {
    return (
      <Box sx={{ px: 2, mb: 3 }}>
        <Skeleton variant="text" width={160} height={32} />
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', mt: 1 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={200}
              height={220}
              sx={{ borderRadius: '20px', flexShrink: 0 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (!venues || venues.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, mb: 1.5 }}>
        <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 22 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
          Trending Now
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          px: 2,
          pb: 1,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {venues.map((venue, idx) => (
          <Link key={venue.id} href={`/venue/${venue.id}`} passHref legacyBehavior>
            <Box
              component="a"
              sx={{
                position: 'relative',
                flexShrink: 0,
                width: 200,
                height: 220,
                borderRadius: '20px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              {/* Background image or gradient */}
              {venue.photoUrl ? (
                <Box
                  component="img"
                  src={venue.photoUrl}
                  alt={venue.name}
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}40, ${theme.palette.primary.dark}80)`,
                  }}
                />
              )}

              {/* Gradient overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)',
                }}
              />

              {/* Rank badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {idx + 1}
              </Box>

              {/* Content */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.5,
                }}
              >
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1.2,
                    mb: 0.3,
                  }}
                >
                  {venue.name}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 12,
                    mb: 0.5,
                  }}
                >
                  {venue.cuisineType}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ color: '#FFD36E', fontSize: 14 }} />
                  <Typography
                    sx={{ color: '#fff', fontWeight: 700, fontSize: 13 }}
                  >
                    {Number(venue.rating).toFixed(1)}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 11,
                      ml: 0.5,
                    }}
                  >
                    {venue.reviewsCount} reviews
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
}
export default React.memo(TrendingSection);
