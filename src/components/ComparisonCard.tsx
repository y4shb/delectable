import { Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import type { Venue } from '../types';

interface ComparisonCardProps {
  venue: Venue;
  onSelect: () => void;
  isWinner?: boolean;
  isLoser?: boolean;
  disabled?: boolean;
}

export default function ComparisonCard({
  venue,
  onSelect,
  isWinner = false,
  isLoser = false,
  disabled = false,
}: ComparisonCardProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Select ${venue.name}`}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          onSelect();
        }
      }}
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: isWinner
          ? 'scale(1.05)'
          : isLoser
            ? 'scale(0.92)'
            : 'scale(1)',
        opacity: isLoser ? 0.4 : 1,
        boxShadow: isWinner
          ? '0 8px 32px rgba(242, 77, 79, 0.35)'
          : '0 4px 20px rgba(0, 0, 0, 0.12)',
        '&:hover': !disabled
          ? {
              transform: isWinner || isLoser ? undefined : 'scale(1.02)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
            }
          : {},
        '&:active': !disabled
          ? {
              transform: 'scale(0.98)',
            }
          : {},
        flex: 1,
        minHeight: 220,
        maxHeight: 320,
      }}
    >
      {/* Venue photo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: venue.photoUrl
            ? `url(${venue.photoUrl})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)',
        }}
      />

      {/* Winner border effect */}
      {isWinner && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '3px solid #F24D4F',
            borderRadius: '20px',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Rating badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          borderRadius: '12px',
          px: 1.2,
          py: 0.4,
          fontWeight: 700,
          fontSize: 16,
          zIndex: 2,
          backdropFilter: 'blur(4px)',
        }}
      >
        {Number(venue.rating).toFixed(1)}
      </Box>

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
          minHeight: 220,
          p: 2.5,
          pb: 2,
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1.2,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            mb: 0.5,
          }}
        >
          {venue.name}
        </Typography>

        {venue.cuisineType && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
            <RestaurantIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }} />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {venue.cuisineType}
            </Typography>
          </Box>
        )}

        {venue.locationText && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {venue.locationText}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
