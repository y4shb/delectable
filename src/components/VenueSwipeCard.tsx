import React, { useRef, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  SkipNext,
  Star,
  LocationOn,
  Restaurant,
} from '@mui/icons-material';
import type { DinnerPlanVenue } from '../types';

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = -80;

interface VenueSwipeCardProps {
  venueOption: DinnerPlanVenue;
  currentIndex: number;
  totalCount: number;
  onVote: (venueId: string, vote: 'yes' | 'no' | 'skip') => void;
}

export default function VenueSwipeCard({
  venueOption,
  currentIndex,
  totalCount,
  onVote,
}: VenueSwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const venue = venueOption.venueDetail;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setDragOffset({ x: dx, y: Math.min(dy, 0) }); // only allow upward drag for skip
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > SWIPE_THRESHOLD) {
      setExitDirection('right');
      setTimeout(() => onVote(venueOption.venue, 'yes'), 300);
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      setExitDirection('left');
      setTimeout(() => onVote(venueOption.venue, 'no'), 300);
    } else if (dragOffset.y < SWIPE_UP_THRESHOLD) {
      setExitDirection('up');
      setTimeout(() => onVote(venueOption.venue, 'skip'), 300);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset, onVote, venueOption.venue]);

  // Compute visual feedback
  const rotation = isDragging ? dragOffset.x * 0.05 : 0;
  const swipeRatio = Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 1);
  const isRight = dragOffset.x > 0;
  const isUp = dragOffset.y < SWIPE_UP_THRESHOLD * 0.5;

  const getExitTransform = () => {
    if (exitDirection === 'right') return 'translateX(120vw) rotate(20deg)';
    if (exitDirection === 'left') return 'translateX(-120vw) rotate(-20deg)';
    if (exitDirection === 'up') return 'translateY(-120vh)';
    return `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        mx: 'auto',
        height: '70vh',
        minHeight: 480,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Progress indicator */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {currentIndex + 1} of {totalCount} venues
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={((currentIndex + 1) / totalCount) * 100}
          sx={{
            borderRadius: 4,
            height: 6,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#F24D4F',
              borderRadius: 4,
            },
          }}
        />
      </Box>

      {/* Swipeable card */}
      <Card
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: getExitTransform(),
          transition: isDragging
            ? 'none'
            : exitDirection
              ? 'transform 0.3s ease-out'
              : 'transform 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Venue photo */}
        <CardMedia
          component="img"
          image={venue?.photoUrl || '/images/placeholder-venue.jpg'}
          alt={venue?.name || 'Venue'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Yes/No overlay */}
        {isDragging && swipeRatio > 0.1 && !isUp && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: isRight
                ? `rgba(76, 175, 80, ${swipeRatio * 0.5})`
                : `rgba(244, 67, 54, ${swipeRatio * 0.5})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 4,
                py: 2,
                borderRadius: 3,
                border: '3px solid white',
                transform: `scale(${0.8 + swipeRatio * 0.4})`,
              }}
            >
              {isRight ? (
                <ThumbUp sx={{ color: 'white', fontSize: 48 }} />
              ) : (
                <ThumbDown sx={{ color: 'white', fontSize: 48 }} />
              )}
              <Typography
                sx={{
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {isRight ? 'Yes' : 'Nope'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Skip overlay */}
        {isDragging && isUp && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(158, 158, 158, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 4,
                py: 2,
                borderRadius: 3,
                border: '3px solid white',
              }}
            >
              <SkipNext sx={{ color: 'white', fontSize: 48 }} />
              <Typography
                sx={{
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                Skip
              </Typography>
            </Box>
          </Box>
        )}

        {/* Gradient overlay for text readability */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background:
              'linear-gradient(transparent, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.85))',
            zIndex: 1,
          }}
        />

        {/* Venue info */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            zIndex: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 800,
              mb: 0.5,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {venue?.name || 'Unknown Venue'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {venue?.cuisineType && (
              <Chip
                icon={<Restaurant sx={{ fontSize: 16 }} />}
                label={venue.cuisineType}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ color: '#FFD700', fontSize: 20 }} />
              <Typography
                sx={{ color: 'white', fontWeight: 700, fontSize: 16 }}
              >
                {venue?.rating ?? '-'}
              </Typography>
            </Box>
          </Box>

          {venue?.locationText && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {venue.locationText}
              </Typography>
            </Box>
          )}

          {/* Swipe hints */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
              opacity: 0.6,
            }}
          >
            <Typography variant="caption" sx={{ color: 'white' }}>
              Swipe left: No
            </Typography>
            <Typography variant="caption" sx={{ color: 'white' }}>
              Swipe up: Skip
            </Typography>
            <Typography variant="caption" sx={{ color: 'white' }}>
              Swipe right: Yes
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
