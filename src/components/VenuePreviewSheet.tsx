import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Chip, Button, useTheme, IconButton } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { Venue } from '../types';

interface VenuePreviewSheetProps {
  venue: Venue | null;
  onDismiss: () => void;
}

export default function VenuePreviewSheet({ venue, onDismiss }: VenuePreviewSheetProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Slide up when venue changes
  useEffect(() => {
    if (venue) {
      // Small delay to trigger CSS transition
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [venue]);

  // Escape key to dismiss
  useEffect(() => {
    if (!venue) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [venue, onDismiss]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    setIsDragging(true);
    setDragY(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = e.clientY - startYRef.current;
    // Only allow downward drag
    setDragY(Math.max(0, dy));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 80) {
      // Dismiss
      setVisible(false);
      setTimeout(onDismiss, 300);
    } else {
      setDragY(0);
    }
  }, [isDragging, dragY, onDismiss]);

  if (!venue) return null;

  const translateY = visible ? dragY : 400;
  const opacity = isDragging ? Math.max(0.5, 1 - dragY / 200) : visible ? 1 : 0;

  return (
    <Box
      ref={sheetRef}
      role="dialog"
      aria-label={`${venue.name} preview`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 20,
        maxWidth: 420,
        mx: 'auto',
        borderRadius: '20px',
        overflow: 'hidden',
        bgcolor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 2px 12px rgba(0,0,0,0.1)',
        transform: `translateY(${translateY}px)`,
        opacity,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
      }}
    >
      {/* Drag handle + close button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          pt: 1,
          pb: 0.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
          }}
        />
        <IconButton
          aria-label="Close venue preview"
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          size="small"
          sx={{
            position: 'absolute',
            right: 8,
            top: 4,
            color: 'text.secondary',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Venue photo */}
      <Box
        component="img"
        src={venue.photoUrl}
        alt={venue.name}
        sx={{
          width: '100%',
          height: 140,
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Name + Rating */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.3,
                color: 'text.primary',
              }}
            >
              {venue.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              {venue.cuisineType} &middot; {venue.locationText}
            </Typography>
          </Box>

          {/* Rating badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderRadius: '12px',
              px: 1,
              py: 0.5,
              flexShrink: 0,
            }}
          >
            <StarIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.primary.main }}>
              {Number(venue.rating).toFixed(1)}
            </Typography>
            {venue.reviewsCount > 0 && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                ({venue.reviewsCount})
              </Typography>
            )}
          </Box>
        </Box>

        {/* Tags */}
        {venue.tags && venue.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {venue.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: '8px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  color: 'text.secondary',
                }}
              />
            ))}
          </Box>
        )}

        {/* View Details button */}
        <Link href={`/venue/${venue.id}`} passHref legacyBehavior>
          <Button
            component="a"
            fullWidth
            variant="contained"
            disableElevation
            sx={{
              mt: 1.5,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
              py: 1,
              bgcolor: theme.palette.primary.main,
              color: '#fff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            View Details
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
