import { Box, Typography, Avatar, Chip, Stack } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useEffect, useRef, useState } from 'react';

interface ReviewCardProps {
  venue: string;
  location: string;
  dish?: string;
  tags?: string[];
  user: { name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  date: string;
  likeCount?: number;
  commentCount?: number;
}

export default function ReviewCard({
  venue,
  location,
  dish,
  tags = [],
  user,
  rating,
  text,
  photoUrl,
  date,
  likeCount = 0,
  commentCount = 0,
}: ReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Check if the card is in the center 50% of the viewport
        const { intersectionRatio, boundingClientRect } = entry;
        const viewportHeight = window.innerHeight;
        const cardCenter = boundingClientRect.top + boundingClientRect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
        
        // Consider card "in view" if it's close to center and has good intersection ratio
        const isNearCenter = distanceFromCenter < viewportHeight * 0.25;
        setIsInView(intersectionRatio > 0.5 && isNearCenter);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  return (
    <Box
      ref={cardRef}
      sx={theme => ({
        bgcolor: theme.palette.background.paper,
        borderRadius: 4,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
        border: theme.palette.mode === 'dark' ? '6px solid rgba(0,0,0,0.3)' : '6px solid rgba(255,255,255,0.3)',
        mb: 2,
        overflow: 'hidden',
        maxWidth: 420,
        mx: 'auto',
        width: '90%',
        p: 0,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        '&:hover .review-content, & .review-content': {
          transform: isInView ? 'translateY(0)' : undefined,
        },
        '&:hover .review-content': {
          transform: 'translateY(0)',
        },
        '&:hover .expandable-content, & .expandable-content': {
          opacity: isInView ? 1 : undefined,
          maxHeight: isInView ? '200px' : undefined,
        },
        '&:hover .expandable-content': {
          opacity: 1,
          maxHeight: '200px',
        },
      })}
    >
      {/* Image & overlays */}
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '0.8', minHeight: 450, background: '#eee' }}>
        <img
          src={photoUrl}
          alt={venue}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Rating overlay */}
        <Typography sx={{
          position: 'absolute',
          top: 24,
          right: 28,
          color: '#fff',
          fontWeight: 700,
          fontSize: 28,
          textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
          opacity: 0.7,
          zIndex: 2,
        }}>{rating.toFixed(1)}</Typography>

        
        {/* Content overlay - positioned absolutely over image */}
        <Box 
          className="review-content" 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            transform: 'translateY(85%)', // Show 15% by default - lower position
            transition: 'all 0.3s ease-in-out',
            p: 3,
            pt: 3,
            pb: 3,
            minHeight: '140px',
          }}
        >
          {/* Profile, Venue name & Heart row - Always visible */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, px: 0.5 }}>
            <Avatar src={user.avatarUrl} sx={{ width: 36, height: 36, border: '1px solid #fff' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1.1, textShadow: '0px 2px 8px rgba(0,0,0,0.65)' }}>{venue}</Typography>
              {dish && (
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 14, textShadow: '0px 2px 8px rgba(0,0,0,0.65)', mt: 0.3, lineHeight: 1.2 }}>{dish}</Typography>
              )}
            </Box>
            <Box sx={{ 
              bgcolor: '#F24D4F', 
              color: '#fff', 
              width: 22, 
              height: 20, 
              fontWeight: 700, 
              fontSize: 11, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 11,
                height: 18,
                bgcolor: '#F24D4F',
                borderRadius: '11px 11px 0 0',
                transform: 'translateX(-50%) rotate(-45deg)',
                transformOrigin: '0 100%',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 11,
                height: 18,
                bgcolor: '#F24D4F',
                borderRadius: '11px 11px 0 0',
                transform: 'translateX(-50%) rotate(45deg)',
                transformOrigin: '100% 100%',
              }
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>{likeCount}</span>
            </Box>
          </Box>
          
          {/* Expandable content - Hidden by default, shown on hover */}
          <Box className="expandable-content" sx={{ opacity: 0, maxHeight: 0, overflow: 'hidden', transition: 'all 0.3s ease-in-out' }}>
            {/* Tags/chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              {tags.map((tag, i) => (
                <Chip
                  key={i}
                  label={tag}
                  sx={theme => ({
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 35, 0.9)' : 'rgba(251, 234, 236, 0.9)',
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#F24D4F',
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 2,
                    height: 28,
                    border: theme.palette.mode === 'dark' ? `2px solid ${theme.palette.primary.main}` : 'none',
                  })}
                  size="small"
                />
              ))}
            </Box>
            
            {/* Review text */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'baseline' }}>
              <Typography sx={{ fontWeight: 400, fontSize: 15, color: '#fff', flex: 1 }}>{text}</Typography>
              <Typography sx={{ fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{date}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
