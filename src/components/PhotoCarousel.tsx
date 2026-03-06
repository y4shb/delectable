import { Box, IconButton, Typography, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PhotoCarouselProps {
  photos: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  venue?: string;
  rating?: number;
  user?: { name: string; avatarUrl: string };
}

export default function PhotoCarousel({
  photos,
  initialIndex = 0,
  open,
  onClose,
  venue,
  rating,
  user,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsClosing(false);
      document.body.classList.add('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) setCurrentIndex((i) => i + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, currentIndex, photos.length]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    setDragX(0);
    setDragY(0);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setDragX(e.clientX - startX.current);
      setDragY(e.clientY - startY.current);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY > 120) {
      handleClose();
      setDragX(0);
      setDragY(0);
      return;
    }

    const threshold = 80;
    if (dragX < -threshold && currentIndex < photos.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (dragX > threshold && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
    setDragX(0);
    setDragY(0);
  }, [isDragging, dragX, dragY, currentIndex, photos.length, handleClose]);

  if (!open || photos.length === 0) return null;

  const opacity = isClosing ? 0 : dragY > 0 ? Math.max(0.3, 1 - dragY / 400) : 1;
  const scale = dragY > 0 ? Math.max(0.85, 1 - dragY / 1500) : 1;

  return (
    <Box
      ref={containerRef}
      onClick={(e) => {
        if (e.target === containerRef.current) handleClose();
      }}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        backgroundColor: `rgba(0, 0, 0, ${0.85 * opacity})`,
        transition: isClosing
          ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : isDragging
            ? 'none'
            : 'background-color 0.3s ease',
        '@keyframes carouselFadeIn': {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        animation: !isClosing ? 'carouselFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
        opacity: isClosing ? 0 : 1,
        cursor: 'default',
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          color: '#fff',
          bgcolor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Photo counter */}
      {photos.length > 1 && (
        <Typography
          sx={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.05em',
            zIndex: 10,
          }}
        >
          {currentIndex + 1} / {photos.length}
        </Typography>
      )}

      {/* Navigation arrows */}
      {photos.length > 1 && currentIndex > 0 && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i - 1);
          }}
          sx={{
            position: 'absolute',
            left: 16,
            zIndex: 10,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)', transform: 'scale(1.1)' },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 28 }} />
        </IconButton>
      )}
      {photos.length > 1 && currentIndex < photos.length - 1 && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i + 1);
          }}
          sx={{
            position: 'absolute',
            right: 16,
            zIndex: 10,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)', transform: 'scale(1.1)' },
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 28 }} />
        </IconButton>
      )}

      {/* Photo container */}
      <Box
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          mx: 2,
          transform: `translateX(${isDragging ? dragX * 0.6 : 0}px) translateY(${isDragging ? Math.max(0, dragY) * 0.6 : 0}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '24px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <Box
            component="img"
            src={photos[currentIndex]}
            alt={venue ? `${venue} photo ${currentIndex + 1}` : `Photo ${currentIndex + 1}`}
            draggable={false}
            sx={{
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom gradient with review info */}
          {(venue || user) && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                p: 3,
                pt: 6,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {user && (
                  <Avatar
                    src={user.avatarUrl}
                    sx={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.5)' }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {venue && (
                    <Typography
                      sx={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 18,
                        lineHeight: 1.2,
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {venue}
                    </Typography>
                  )}
                  {user && (
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      by {user.name}
                    </Typography>
                  )}
                </Box>
                {rating != null && (
                  <Typography
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 24,
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {Number(rating).toFixed(1)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 10,
          }}
        >
          {photos.map((_, i) => (
            <Box
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              sx={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': { bgcolor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.6)' },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
