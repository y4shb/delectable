import { Box, Typography, Avatar, Chip, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeReview, unlikeReview, bookmarkReview, unbookmarkReview } from '../api/api';
import Link from 'next/link';
import type { Comment } from '../types';

interface ReviewCardProps {
  id: string;
  venue: string;
  venueId?: string;
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
  isLiked?: boolean;
  isBookmarked?: boolean;
  recentComments?: Comment[];
}

export default function ReviewCard({
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
  date,
  likeCount: initialLikeCount = 0,
  commentCount = 0,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false,
  recentComments = [],
}: ReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialIsBookmarked);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef(0);
  const heartBurstTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const queryClient = useQueryClient();

  // Sync local state from props when server data changes after refetch
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
      if (liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
        unlikeMutation.mutate();
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
        likeMutation.mutate();
        // Heart burst animation
        setShowHeartBurst(true);
        if (heartBurstTimerRef.current) clearTimeout(heartBurstTimerRef.current);
        heartBurstTimerRef.current = setTimeout(() => setShowHeartBurst(false), 800);
      }
    },
    [liked, likeMutation, unlikeMutation],
  );

  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      e.preventDefault();
      e.stopPropagation();
      if (!liked) {
        handleLikeToggle();
      } else {
        setShowHeartBurst(true);
        if (heartBurstTimerRef.current) clearTimeout(heartBurstTimerRef.current);
        heartBurstTimerRef.current = setTimeout(() => setShowHeartBurst(false), 800);
      }
    }
    lastTapRef.current = now;
  }, [liked, handleLikeToggle]);

  const handleBookmarkToggle = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
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

  const cardContent = (
    <Box
      ref={cardRef}
      id={`review-card-${id}`}
      role="article"
      aria-labelledby={`review-title-${id}`}
      onClick={handleDoubleTap}
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        borderRadius: 4,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
        border:
          theme.palette.mode === 'dark'
            ? '6px solid rgba(0,0,0,0.3)'
            : '6px solid rgba(255,255,255,0.3)',
        mb: 2,
        overflow: 'hidden',
        maxWidth: 420,
        mx: 'auto',
        width: '90%',
        p: 0,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
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
      {/* Image & overlays */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          width: '100%',
          aspectRatio: '0.8',
          minHeight: 450,
          background:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eee',
        })}
      >
        <img
          src={photoUrl}
          alt={venue}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

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

        {/* Rating overlay */}
        <Typography
          sx={{
            position: 'absolute',
            top: 24,
            right: 28,
            color: '#fff',
            fontWeight: 700,
            fontSize: 28,
            textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
            opacity: 0.7,
            zIndex: 2,
          }}
        >
          {Number(rating).toFixed(1)}
        </Typography>

        {/* Content overlay */}
        <Box
          className="review-content"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            transform: 'translateY(85%)',
            transition: 'all 0.3s ease-in-out',
            p: 3,
            pt: 3,
            pb: 3,
            minHeight: '140px',
          }}
        >
          {/* Profile, Venue name & actions row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, px: 0.5 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{ width: 36, height: 36, border: '1px solid #fff' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                id={`review-title-${id}`}
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: 1.1,
                  textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
                }}
              >
                {venue}
              </Typography>
              {dish && (
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500,
                    fontSize: 14,
                    textShadow: '0px 2px 8px rgba(0,0,0,0.65)',
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
              {/* Like button */}
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
                  transition: 'transform 0.2s',
                  '&:active': { transform: 'scale(1.3)' },
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
              {/* Comment count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#fff' }} />
                <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {commentCount}
                </Typography>
              </Box>
              {/* Bookmark */}
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
                  transition: 'transform 0.2s',
                  '&:active': { transform: 'scale(1.3)' },
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
              transition: 'all 0.3s ease-in-out',
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
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(35, 35, 35, 0.9)'
                        : 'rgba(251, 234, 236, 0.9)',
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 2,
                    height: 28,
                    border:
                      theme.palette.mode === 'dark'
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                    cursor: 'pointer',
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: theme.palette.primary.main,
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
                sx={{ fontWeight: 400, fontSize: 15, color: '#fff', flex: 1 }}
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
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      mt: 0.5,
                    }}
                  >
                    View all {commentCount} comments
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Wrap in Link to review detail
  return (
    <Link href={`/review/${id}`} legacyBehavior passHref>
      <Box component="a" sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {cardContent}
      </Box>
    </Link>
  );
}
