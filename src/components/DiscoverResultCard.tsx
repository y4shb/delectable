import { Box, Chip, Typography, useTheme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PlaceIcon from '@mui/icons-material/Place';
import Link from 'next/link';
import type { DiscoverResult } from '../types';

interface DiscoverResultCardProps {
  result: DiscoverResult;
  index: number;
}

export default function DiscoverResultCard({ result, index }: DiscoverResultCardProps) {
  const theme = useTheme();
  const { venue, score, explanation, matchReasons, distanceKm } = result;

  // Circular progress values
  const scorePercent = Math.min(Math.round(score), 100);
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  return (
    <Link href={`/venue/${venue.id}`} passHref legacyBehavior>
      <Box
        component="a"
        role="article"
        aria-label={`${venue.name}, ${scorePercent}% match`}
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = `/venue/${venue.id}`;
          }
        }}
        sx={{
          display: 'flex',
          textDecoration: 'none',
          color: 'inherit',
          bgcolor: theme.palette.background.paper,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          opacity: 0,
          animation: `discoverFadeIn 0.5s ease forwards`,
          animationDelay: `${index * 100}ms`,
          '@keyframes discoverFadeIn': {
            '0%': { opacity: 0, transform: 'translateY(16px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        }}
      >
        {/* Venue photo with gradient overlay */}
        <Box
          sx={{
            position: 'relative',
            width: 130,
            minHeight: 160,
            flexShrink: 0,
          }}
        >
          {venue.photoUrl ? (
            <Box
              component="img"
              src={venue.photoUrl}
              alt={venue.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
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
              background: 'linear-gradient(90deg, transparent 40%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          {/* Match score badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 52,
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="rgba(0,0,0,0.5)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                stroke={theme.palette.primary.main}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1,
                zIndex: 1,
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {scorePercent}%
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.2,
              mb: 0.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {venue.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            {venue.cuisineType && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                {venue.cuisineType}
              </Typography>
            )}
            {venue.cuisineType && venue.rating > 0 && (
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: 10 }}>
                {' \u00B7 '}
              </Typography>
            )}
            {venue.rating > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <StarIcon sx={{ color: '#FFD36E', fontSize: 13 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                  {Number(venue.rating).toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>

          {venue.locationText && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.8 }}>
              <PlaceIcon sx={{ fontSize: 13, color: theme.palette.text.secondary }} />
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {venue.locationText}
                {distanceKm !== null && ` (${distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`})`}
              </Typography>
            </Box>
          )}

          {/* Explanation */}
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.text.secondary,
              lineHeight: 1.3,
              mb: 0.8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontStyle: 'italic',
            }}
          >
            {explanation}
          </Typography>

          {/* Match reason chips */}
          {matchReasons.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'wrap',
              }}
              role="list"
              aria-label="Why you will love it"
            >
              {matchReasons.slice(0, 3).map((reason) => (
                <Chip
                  key={reason}
                  label={reason}
                  role="listitem"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: '11px',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(242, 77, 79, 0.15)'
                      : 'rgba(242, 77, 79, 0.08)',
                    color: theme.palette.primary.main,
                    border: `1px solid ${theme.palette.primary.main}30`,
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Link>
  );
}
