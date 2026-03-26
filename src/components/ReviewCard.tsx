import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar, Chip, Stack, IconButton, Menu, MenuItem } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import VerifiedIcon from '@mui/icons-material/Verified';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeReview, unlikeReview, bookmarkReview, unbookmarkReview } from '../api/api';
import Link from 'next/link';
import Image from 'next/image';
import type { Comment } from '../types';
import dynamic from 'next/dynamic';
const PhotoCarousel = dynamic(() => import('./PhotoCarousel'), { ssr: false });
const ReportDialog = dynamic(() => import('./ReportDialog'), { ssr: false });

interface ReviewCardProps {
  id: string;
  venue: string;
  venueId?: string;
  location: string;
  dish?: string;
  tags?: string[];
  user: { id?: string; name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  photoUrls?: string[];
  date: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  recentComments?: Comment[];
  priceLevel?: number;
  distance?: number;
  isVerifiedVisit?: boolean;
}

function ReviewCard({
  id,
  venue,
  venueId,
  location,
  dish,
  tags = [],
  user,
  rating,
  text,
  photoUrl,
  photoUrls: photoUrlsProp,
  date,
  likeCount: initialLikeCount = 0,
  commentCount = 0,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false,
  recentComments = [],
  priceLevel,
  distance,
  isVerifiedVisit,
}: ReviewCardProps) {
  const photos = photoUrlsProp?.length ? photoUrlsProp : photoUrl ? [photoUrl] : [];
  const hasMultiplePhotos = photos.length > 1;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialIsBookmarked);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Deck swipe state
  const [deckIndex, setDeckIndex] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeStartTime = useRef(0);
  const swipeMoved = useRef(false);

  const lastTapRef = useRef(0);
  const heartBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => { setLiked(initialIsLiked); }, [initialIsLiked]);
  useEffect(() => { setLikeCount(initialLikeCount); }, [initialLikeCount]);
  useEffect(() => { setBookmarked(initialIsBookmarked); }, [initialIsBookmarked]);

  useEffect(() => {
    return () => {
      if (heartBurstTimerRef.current) {
        clearTimeout(heartBurstTimerRef.current);
      }
    };
  }, []);

  const likeMutation = useMutation({
    mutationFn: () => likeReview(id),
    onError: () => {
      setLiked(false);
      setLikeCount((c) => c - 1);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feedReviews'] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => unlikeReview(id),
    onError: () => {
      setLiked(true);
      setLikeCount((c) => c + 1);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feedReviews'] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkReview(id),
    onError: () => setBookmarked(false),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const unbookmarkMutation = useMutation({
    mutationFn: () => unbookmarkReview(id),
    onError: () => setBookmarked(true),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const handleLikeToggle = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      navigator.vibrate?.(10);
      if (likeMutation.isPending || unlikeMutation.isPending) return;

      if (liked) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        unlikeMutation.mutate();
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
        likeMutation.mutate();
        setShowHeartBurst(true);
        if (heartBurstTimerRef.current) clearTimeout(heartBurstTimerRef.current);
        heartBurstTimerRef.current = setTimeout(() => setShowHeartBurst(false), 800);
      }
    },
    [liked, likeMutation, unlikeMutation],
  );

  const handleBookmarkToggle = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      navigator.vibrate?.(10);
      if (bookmarked) {
        setBookmarked(false);
        unbookmarkMutation.mutate();
      } else {
        setBookmarked(true);
        bookmarkMutation.mutate();
      }
    },
    [bookmarked, bookmarkMutation, unbookmarkMutation],
  );

  // Deck swipe handlers
  const handleDeckPointerDown = useCallback((e: React.PointerEvent) => {
    if (!hasMultiplePhotos) return;
    e.stopPropagation();
    setIsSwiping(true);
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeStartTime.current = Date.now();
    swipeMoved.current = false;
    setSwipeX(0);
  }, [hasMultiplePhotos]);

  const handleDeckPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isSwiping) return;
      const dx = e.clientX - swipeStartX.current;
      const dy = e.clientY - swipeStartY.current;
      // Only track horizontal movement if it exceeds vertical
      if (Math.abs(dx) > 8 || swipeMoved.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.2) {
          swipeMoved.current = true;
          setSwipeX(dx);
        }
      }
    },
    [isSwiping],
  );

  const handleDeckPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isSwiping) return;
      e.stopPropagation();
      setIsSwiping(false);
      const elapsed = Date.now() - swipeStartTime.current;
      const velocity = Math.abs(swipeX) / Math.max(elapsed, 1);

      const threshold = 50;
      const velocityThreshold = 0.4;
      const shouldSwipe = Math.abs(swipeX) > threshold || velocity > velocityThreshold;

      if (shouldSwipe && swipeMoved.current) {
        if (swipeX < 0 && deckIndex < photos.length - 1) {
          setDeckIndex((i) => i + 1);
        } else if (swipeX > 0 && deckIndex > 0) {
          setDeckIndex((i) => i - 1);
        }
      }

      setSwipeX(0);
    },
    [isSwiping, swipeX, deckIndex, photos.length],
  );

  // Tap handler: single tap opens carousel, double tap likes
  const handleCardTap = useCallback(
    (e: React.MouseEvent) => {
      // Ignore if we just finished a swipe
      if (swipeMoved.current) return;

      const now = Date.now();
      if (now - lastTapRef.current < 400) {
        // Double tap - like
        e.preventDefault();
        e.stopPropagation();
        if (!liked && !likeMutation.isPending) {
          setLiked(true);
          setLikeCount((c) => c + 1);
          likeMutation.mutate();
        }
        setShowHeartBurst(true);
        if (heartBurstTimerRef.current) clearTimeout(heartBurstTimerRef.current);
        heartBurstTimerRef.current = setTimeout(() => setShowHeartBurst(false), 800);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        // Delay single tap to wait for possible double tap
        setTimeout(() => {
          if (lastTapRef.current === now) {
            // Single tap — open carousel if multi-photo, otherwise navigate
            if (photos.length > 0) {
              setCarouselOpen(true);
            }
          }
        }, 400);
      }
    },
    [liked, likeMutation, photos.length],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const { intersectionRatio, boundingClientRect } = entry;
        const viewportHeight = window.innerHeight;
        const cardCenter = boundingClientRect.top + boundingClientRect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
        const isNearCenter = distanceFromCenter < viewportHeight * 0.25;
        setIsInView(intersectionRatio > 0.5 && isNearCenter);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px',
      },
    );

    const node = cardRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  // Auto-slideshow: cycle through photos when card is in view
  useEffect(() => {
    if (!isInView || !hasMultiplePhotos || isSwiping) return;
    const timer = setInterval(() => {
      setDeckIndex((prev) => (prev + 1) % photos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isInView, hasMultiplePhotos, photos.length, isSwiping]);

  // Current deck photo with offset from swipe
  const currentPhoto = photos[deckIndex] || photoUrl;

  // Derive price display string
  const priceDisplay = priceLevel
    ? '$'.repeat(Math.min(Math.max(priceLevel, 1), 3))
    : null;

  // Derive walking time in minutes
  const walkingMinutes =
    distance && distance > 0 ? Math.max(1, Math.round(distance / 80)) : null;

  // Shared translucent pill badge style
  const badgePillSx = {
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    lineHeight: 1.4,
  };

  return (
    <>
      <Box
        ref={cardRef}
        id={`review-card-${id}`}
        role="article"
        aria-labelledby={`review-title-${id}`}
        onClick={handleCardTap}
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          borderRadius: '16px',
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.1)',
          mb: 2,
          overflow: 'hidden',
          maxWidth: 420,
          mx: 'auto',
          width: '92%',
          p: 0,
          cursor: 'pointer',
          transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
          position: 'relative',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          '&:hover .review-content, & .review-content': {
            transform: isInView ? 'translateY(0)' : undefined,
          },
          '&:hover .review-content': {
            transform: 'translateY(0)',
          },
          '&:hover .expandable-content, & .expandable-content': {
            opacity: isInView ? 1 : undefined,
            maxHeight: isInView ? '300px' : undefined,
          },
          '&:hover .expandable-content': {
            opacity: 1,
            maxHeight: '300px',
          },
        })}
      >
        {/* Image area with deck-of-cards effect */}
        <Box
          sx={(theme) => ({
            position: 'relative',
            width: '100%',
            aspectRatio: '0.85',
            minHeight: 380,
            background:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eee',
          })}
        >
          {/* Stacked card edges behind main photo (deck effect) */}
          {hasMultiplePhotos && deckIndex < photos.length - 1 && (
            <>
              {/* Third card (deepest) */}
              {deckIndex < photos.length - 2 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 8,
                    right: 8,
                    bottom: -6,
                    borderRadius: 3,
                    overflow: 'hidden',
                    transform: 'scale(0.94) rotate(-1.5deg)',
                    transformOrigin: 'center bottom',
                    opacity: 0.4,
                    zIndex: 0,
                  }}
                >
                  <Image
                    src={photos[deckIndex + 2] || photos[deckIndex + 1] || '/images/food2.jpg'}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 100vw, 600px"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                </Box>
              )}
              {/* Second card */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 3,
                  left: 5,
                  right: 5,
                  bottom: -3,
                  borderRadius: 3,
                  overflow: 'hidden',
                  transform: 'scale(0.97) rotate(-0.8deg)',
                  transformOrigin: 'center bottom',
                  opacity: 0.6,
                  zIndex: 1,
                }}
              >
                <Image
                  src={photos[deckIndex + 1] || '/images/food2.jpg'}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 100vw, 600px"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              </Box>
            </>
          )}

          {/* Main photo (top card) */}
          <Box
            onPointerDown={handleDeckPointerDown}
            onPointerMove={handleDeckPointerMove}
            onPointerUp={handleDeckPointerUp}
            onPointerCancel={handleDeckPointerUp}
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              zIndex: 2,
              touchAction: hasMultiplePhotos ? 'pan-y' : 'auto',
              transform: isSwiping && swipeMoved.current
                ? `translateX(${swipeX * 0.5}px) rotate(${swipeX * 0.02}deg)`
                : 'translateX(0) rotate(0deg)',
              transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
              userSelect: 'none',
            }}
          >
            {/* Crossfade: render all photos stacked, only current one is visible */}
            {photos.length > 1 ? (
              photos.map((photo, i) => (
                <Image
                  key={photo}
                  src={photo}
                  alt={i === deckIndex ? (dish ? `${dish} at ${venue}` : `Food photo from ${venue}`) : ''}
                  fill
                  sizes="(max-width: 600px) 100vw, 600px"
                  style={{
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    opacity: i === deckIndex ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                  }}
                  priority={false}
                  draggable={false}
                />
              ))
            ) : (
              <Image
                src={currentPhoto || '/images/food2.jpg'}
                alt={dish ? `${dish} at ${venue}` : `Food photo from ${venue}`}
                fill
                sizes="(max-width: 600px) 100vw, 600px"
                style={{ objectFit: 'cover', pointerEvents: 'none' }}
                priority={false}
                draggable={false}
              />
            )}
          </Box>

          {/* Dot indicators for multi-photo */}
          {hasMultiplePhotos && (
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 0.6,
                zIndex: 5,
              }}
            >
              {photos.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: i === deckIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: i === deckIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </Box>
          )}

          {/* Heart burst animation overlay */}
          {showHeartBurst && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                pointerEvents: 'none',
                '@keyframes heartBurst': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                  '50%': { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
                  '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
                },
                animation: 'heartBurst 0.8s ease-out forwards',
              }}
            >
              <FavoriteIcon sx={{ fontSize: 80, color: '#fff', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} />
            </Box>
          )}

          {/* Price + Distance badge row */}
          {(priceDisplay || walkingMinutes !== null) && (
            <Box
              sx={{
                position: 'absolute',
                top: 24,
                left: 20,
                display: 'flex',
                flexDirection: 'row',
                gap: '6px',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              {priceDisplay && (
                <Box sx={badgePillSx}>
                  {priceDisplay}
                </Box>
              )}
              {walkingMinutes !== null && (
                <Box sx={badgePillSx}>
                  <DirectionsWalkIcon sx={{ fontSize: 14 }} />
                  {walkingMinutes} min walk
                </Box>
              )}
            </Box>
          )}

          {/* Verified visit badge */}
          {isVerifiedVisit && (
            <Box
              sx={(theme) => ({
                position: 'absolute',
                top: 56,
                left: 20,
                zIndex: 2,
                pointerEvents: 'none',
                background: theme.palette.primary.main,
                color: '#fff',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                lineHeight: 1.4,
              })}
            >
              <VerifiedIcon sx={{ fontSize: 14 }} />
              Verified
            </Box>
          )}

          {/* Rating overlay */}
          <Box
            role="img"
            aria-label={`Rating: ${Number(rating).toFixed(1)} out of 10`}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              px: 1.2,
              py: 0.4,
              zIndex: 3,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
              {Number(rating).toFixed(1)}
            </Typography>
          </Box>

          {/* More options (report) button */}
          <IconButton
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchorEl(e.currentTarget);
            }}
            sx={{
              position: 'absolute',
              top: 16,
              right: 68,
              zIndex: 5,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
            }}
            size="small"
          >
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={(e: React.SyntheticEvent) => {
              (e as React.MouseEvent)?.stopPropagation?.();
              setMenuAnchorEl(null);
            }}
            onClick={(e) => e.stopPropagation()}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchorEl(null);
                setReportDialogOpen(true);
              }}
            >
              <FlagIcon sx={{ fontSize: 18, mr: 1, color: 'error.main' }} />
              Report
            </MenuItem>
          </Menu>

          {/* Content overlay */}
          <Box
            className="review-content"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.9) 100%)',
              transform: 'translateY(75%)',
              transition: 'transform 0.3s cubic-bezier(0, 0, 0.2, 1), opacity 0.3s cubic-bezier(0, 0, 0.2, 1)',
              p: 2.5,
              pt: 4,
              pb: 2.5,
              minHeight: '130px',
              zIndex: 4,
            }}
          >
            {/* Profile, Venue name & actions row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
              {user.id ? (
                <Link href={`/user/${user.id}`} passHref legacyBehavior>
                  <Box
                    component="a"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    sx={{ cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      sx={{ width: 36, height: 36, border: '1px solid #fff' }}
                    />
                  </Box>
                </Link>
              ) : (
                <Avatar
                  src={user.avatarUrl}
                  sx={{ width: 36, height: 36, border: '1px solid #fff' }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  id={`review-title-${id}`}
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    lineHeight: 1.2,
                    textShadow: '0px 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {venue}
                </Typography>
                {dish && (
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontWeight: 500,
                      fontSize: 13,
                      textShadow: '0px 1px 4px rgba(0,0,0,0.5)',
                      mt: 0.3,
                      lineHeight: 1.2,
                    }}
                  >
                    {dish}
                  </Typography>
                )}
              </Box>
              {/* Action buttons */}
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <Box
                  onClick={handleLikeToggle}
                  role="button"
                  aria-label={liked ? 'Unlike' : 'Like'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLikeToggle(); } }}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.3,
                    minWidth: 44,
                    minHeight: 44,
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                    '&:active': { transform: 'scale(0.95)' },
                    '&:focus-visible': { outline: '2px solid #F24D4F', outlineOffset: 2, borderRadius: '4px' },
                  }}
                >
                  {liked ? (
                    <FavoriteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 20, color: '#fff' }} />
                  )}
                  <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {likeCount}
                  </Typography>
                </Box>
                <Link href={`/review/${id}`} passHref legacyBehavior>
                  <Box
                    component="a"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.3, textDecoration: 'none' }}
                  >
                    <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#fff' }} />
                    <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      {commentCount}
                    </Typography>
                  </Box>
                </Link>
                <Box
                  onClick={handleBookmarkToggle}
                  role="button"
                  aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookmarkToggle(); } }}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 44,
                    minHeight: 44,
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                    '&:active': { transform: 'scale(0.95)' },
                    '&:focus-visible': { outline: '2px solid #F24D4F', outlineOffset: 2, borderRadius: '4px' },
                  }}
                >
                  {bookmarked ? (
                    <BookmarkIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ fontSize: 20, color: '#fff' }} />
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Expandable content */}
            <Box
              className="expandable-content"
              sx={{
                opacity: 0,
                maxHeight: 0,
                overflow: 'hidden',
                transition: 'opacity 0.3s cubic-bezier(0, 0, 0.2, 1), max-height 0.3s cubic-bezier(0, 0, 0.2, 1)',
              }}
            >
              {/* Tags */}
              <Box
                className="review-tags"
                role="list"
                aria-label="Review tags"
                sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}
              >
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    role="listitem"
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
                    sx={(theme) => ({
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontWeight: 500,
                      fontSize: 12,
                      borderRadius: '8px',
                      height: 26,
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      '&:focus': {
                        outline: '2px solid #fff',
                        outlineOffset: '2px',
                      },
                    })}
                    size="small"
                  />
                ))}
              </Box>

              {/* Review text */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'baseline',
                }}
              >
                <Typography
                  sx={{ fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.9)', flex: 1, lineHeight: 1.5 }}
                >
                  {text}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.7)',
                    flexShrink: 0,
                  }}
                >
                  {date}
                </Typography>
              </Box>

              {/* Inline recent comments */}
              {recentComments.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  {recentComments.map((comment) => (
                    <Typography
                      key={comment.id}
                      sx={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.85)',
                        mb: 0.3,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{comment.user.name}</span>{' '}
                      {comment.text}
                    </Typography>
                  ))}
                  {commentCount > 2 && (
                    <Link href={`/review/${id}`} passHref legacyBehavior>
                      <Typography
                        component="a"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        sx={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.5)',
                          mt: 0.5,
                          textDecoration: 'none',
                          display: 'block',
                          '&:hover': { color: 'rgba(255,255,255,0.7)' },
                        }}
                      >
                        View all {commentCount} comments
                      </Typography>
                    </Link>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Fullscreen photo carousel overlay */}
      <PhotoCarousel
        photos={photos}
        initialIndex={deckIndex}
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        venue={venue}
        rating={rating}
        user={user}
      />

      {/* Report content dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        contentType="review"
        contentId={id}
      />
    </>
  );
}
export default React.memo(ReviewCard);
