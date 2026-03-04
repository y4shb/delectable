import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import StarIcon from '@mui/icons-material/Star';
import SendIcon from '@mui/icons-material/Send';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useReviewDetail, useReviewComments, useUserReviews, useVenueReviews } from '../../hooks/useApi';
import {
  likeReview,
  unlikeReview,
  bookmarkReview,
  unbookmarkReview,
  createComment,
  reviewToFeedReview,
} from '../../api/api';
import ReviewCard from '../../components/ReviewCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReviewDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const { data: review, isLoading: reviewLoading } = useReviewDetail(id as string);
  const { data: comments, isLoading: commentsLoading } = useReviewComments(id as string);
  const { data: userReviews } = useUserReviews(review?.user?.id);
  const { data: venueReviews } = useVenueReviews(review?.venueDetail?.id);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Sync initial state when review loads
  const [initialized, setInitialized] = useState(false);
  if (review && !initialized) {
    setLiked(review.isLiked);
    setLikeCount(review.likeCount);
    setBookmarked(review.isBookmarked);
    setInitialized(true);
  }

  const likeMutation = useMutation({
    mutationFn: () => likeReview(id as string),
    onError: () => {
      setLiked(false);
      setLikeCount((c) => c - 1);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reviewDetail', id] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => unlikeReview(id as string),
    onError: () => {
      setLiked(true);
      setLikeCount((c) => c + 1);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reviewDetail', id] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkReview(id as string),
    onError: () => setBookmarked(false),
  });

  const unbookmarkMutation = useMutation({
    mutationFn: () => unbookmarkReview(id as string),
    onError: () => setBookmarked(true),
  });

  const commentMutation = useMutation({
    mutationFn: () => createComment(id as string, commentText, replyTo ?? undefined),
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['reviewComments', id] });
      queryClient.invalidateQueries({ queryKey: ['reviewDetail', id] });
    },
  });

  const handleLikeToggle = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      unlikeMutation.mutate();
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      likeMutation.mutate();
    }
  };

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      setBookmarked(false);
      unbookmarkMutation.mutate();
    } else {
      setBookmarked(true);
      bookmarkMutation.mutate();
    }
  };

  if (!router.isReady || reviewLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={32} />
        </Box>
      </AppShell>
    );
  }

  if (!review) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            Review not found
          </Typography>
        </Box>
      </AppShell>
    );
  }

  const otherUserReviews = (userReviews ?? [])
    .filter((r) => r.id !== review.id)
    .slice(0, 4);

  const otherVenueReviews = (venueReviews ?? [])
    .filter((r) => r.id !== review.id)
    .slice(0, 4);

  return (
    <AppShell>
      <Box sx={{ pb: 11 }}>
        {/* Back button */}
        <Box sx={{ mb: 1, px: 1 }}>
          <IconButton
            onClick={() => router.back()}
            aria-label="Go back"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.04)',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Hero photo */}
        {review.photoUrl && (
          <Box
            sx={{
              position: 'relative',
              width: '100vw',
              height: 300,
              mx: 'calc(-50vw + 50%)',
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={review.photoUrl}
              alt={review.venueDetail?.name || 'Review'}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              }}
            />
          </Box>
        )}

        {/* User info bar */}
        <Box sx={{ px: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={review.user.avatarUrl} sx={{ width: 44, height: 44 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              {review.user.name}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Lvl {review.user.level}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 28, color: theme.palette.primary.main }}>
            {review.rating.toFixed(1)}
          </Typography>
        </Box>

        {/* Venue info */}
        {review.venueDetail && (
          <Link href={`/venue/${review.venueDetail.id}`} legacyBehavior passHref>
            <Box
              component="a"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mx: 2,
                mt: 1.5,
                p: 1.5,
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.03)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {review.venueDetail.photoUrl && (
                <Box
                  component="img"
                  src={review.venueDetail.photoUrl}
                  alt={review.venueDetail.name}
                  sx={{ width: 40, height: 40, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {review.venueDetail.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {review.venueDetail.cuisineType} &middot; {review.venueDetail.locationText}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <StarIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.primary.main }}>
                  {review.venueDetail.rating.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </Link>
        )}

        {/* Review text */}
        <Box sx={{ px: 2, mt: 2 }}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.6 }}>
            {review.text}
          </Typography>
        </Box>

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 2, mt: 1.5 }}>
            {review.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  borderRadius: '16px',
                  fontWeight: 500,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                }}
              />
            ))}
          </Stack>
        )}

        {/* Action bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, mt: 2 }}>
          <Box
            onClick={handleLikeToggle}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
          >
            {liked ? (
              <FavoriteIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 24 }} />
            )}
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{likeCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{review.commentCount}</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box
            onClick={handleBookmarkToggle}
            sx={{ cursor: 'pointer' }}
          >
            {bookmarked ? (
              <BookmarkIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
            ) : (
              <BookmarkBorderIcon sx={{ fontSize: 24 }} />
            )}
          </Box>
        </Box>

        <Divider sx={{ mx: 2, mt: 2 }} />

        {/* Comments section */}
        <Box sx={{ px: 2, mt: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
            Comments
          </Typography>

          {/* Comment input */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              size="small"
              placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                  e.preventDefault();
                  commentMutation.mutate();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                },
              }}
            />
            <IconButton
              onClick={() => commentText.trim() && commentMutation.mutate()}
              disabled={!commentText.trim() || commentMutation.isPending}
              sx={{ color: theme.palette.primary.main }}
            >
              {commentMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>

          {replyTo && (
            <Box sx={{ mb: 1 }}>
              <Chip
                label="Replying..."
                size="small"
                onDelete={() => setReplyTo(null)}
                sx={{ fontSize: 12 }}
              />
            </Box>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (comments ?? []).length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              No comments yet. Be the first!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {(comments ?? []).map((comment) => (
                <Box key={comment.id}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar src={comment.user.avatarUrl} sx={{ width: 28, height: 28 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                          {comment.user.name}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: 'text.primary', mt: 0.25 }}>
                        {comment.text}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setReplyTo(comment.id)}
                        sx={{
                          textTransform: 'none',
                          fontSize: 11,
                          color: 'text.secondary',
                          minWidth: 'auto',
                          p: 0,
                          mt: 0.25,
                        }}
                      >
                        Reply
                      </Button>

                      {/* Threaded replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <Stack spacing={1} sx={{ mt: 1, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                          {comment.replies.map((reply) => (
                            <Box key={reply.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <Avatar src={reply.user.avatarUrl} sx={{ width: 22, height: 22 }} />
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: 12 }}>
                                  {reply.user.name}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: 'text.primary' }}>
                                  {reply.text}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* More from this user */}
        {otherUserReviews.length > 0 && (
          <Box sx={{ mt: 4, px: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
              More from {review.user.name}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 1,
              }}
            >
              {otherUserReviews.map((r) => (
                <Link key={r.id} href={`/review/${r.id}`} legacyBehavior passHref>
                  <Box
                    component="a"
                    sx={{
                      flexShrink: 0,
                      width: 150,
                      borderRadius: '20px',
                      overflow: 'hidden',
                      bgcolor: theme.palette.background.paper,
                      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {r.photoUrl && (
                      <Box
                        component="img"
                        src={r.photoUrl}
                        alt={r.venue}
                        sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.venue}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.primary.main }}>
                        {r.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Link>
              ))}
            </Box>
          </Box>
        )}

        {/* More about this venue */}
        {otherVenueReviews.length > 0 && review.venueDetail && (
          <Box sx={{ mt: 4, px: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
              More about {review.venueDetail.name}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 1,
              }}
            >
              {otherVenueReviews.map((r) => (
                <Link key={r.id} href={`/review/${r.id}`} legacyBehavior passHref>
                  <Box
                    component="a"
                    sx={{
                      flexShrink: 0,
                      width: 150,
                      borderRadius: '20px',
                      overflow: 'hidden',
                      bgcolor: theme.palette.background.paper,
                      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {r.photoUrl && (
                      <Box
                        component="img"
                        src={r.photoUrl}
                        alt={r.venue}
                        sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.user.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.primary.main }}>
                        {r.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Link>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
