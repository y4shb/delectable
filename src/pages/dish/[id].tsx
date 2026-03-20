import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import AppShell from '../../layouts/AppShell';
import SEOHead from '../../components/SEOHead';
import ReviewCard from '../../components/ReviewCard';
import { useDishDetail } from '../../hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { fetchVenueReviews } from '../../api/api';
import type { FeedReview } from '../../types';

export default function DishDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const { data: dish, isLoading } = useDishDetail(id as string);

  // Fetch reviews for this dish's venue
  const { data: venueReviews } = useQuery({
    queryKey: ['dishReviews', dish?.venue],
    queryFn: () => fetchVenueReviews(dish!.venue),
    enabled: !!dish?.venue,
  });

  // Filter reviews that match this dish
  const dishReviews: FeedReview[] = (venueReviews ?? []).filter(
    (r) => r.dish === (id as string) || r.dish === dish?.name,
  );

  if (isLoading || !router.isReady) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (!dish) {
    return (
      <AppShell>
        <Box sx={{ pt: 10, textAlign: 'center' }}>
          <Typography>Dish not found.</Typography>
        </Box>
      </AppShell>
    );
  }

  const categoryLabel = dish.category
    ? dish.category.charAt(0).toUpperCase() + dish.category.slice(1)
    : '';

  const venueName = dish.venueDetail?.name || '';
  const dishDescription = `${Number(dish.avgRating).toFixed(1)} stars from ${dish.reviewCount} ${dish.reviewCount === 1 ? 'review' : 'reviews'}${venueName ? ` at ${venueName}` : ''}`;

  return (
    <AppShell>
      <SEOHead
        title={`${dish.name}${venueName ? ` at ${venueName}` : ''}`}
        description={dishDescription}
        url={`/dish/${dish.id}`}
        type="article"
      />
      <Box sx={{ pb: 10 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pt: 2,
            px: 2,
            mb: 2,
          }}
        >
          <IconButton onClick={() => router.back()} aria-label="Go back">
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: 20, flex: 1 }}>
            {dish.name}
          </Typography>
        </Box>

        {/* Dish info card */}
        <Card
          sx={{
            mx: 2,
            borderRadius: '20px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 2px 12px rgba(0,0,0,0.3)'
              : '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: theme.palette.primary.main,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                }}
              >
                <StarIcon sx={{ fontSize: 18, color: '#fff' }} />
                <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  {Number(dish.avgRating).toFixed(1)}
                </Typography>
              </Box>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                {dish.reviewCount} {dish.reviewCount === 1 ? 'review' : 'reviews'}
              </Typography>
              {categoryLabel && (
                <Chip
                  label={categoryLabel}
                  size="small"
                  sx={{ borderRadius: '10px', fontWeight: 500 }}
                />
              )}
            </Box>

            {dish.venueDetail && (
              <Link href={`/venue/${dish.venue}`} passHref legacyBehavior>
                <Typography
                  component="a"
                  sx={{
                    fontSize: 15,
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  @ {dish.venueDetail.name}
                </Typography>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <Stack direction="row" spacing={1.5} sx={{ px: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={() =>
              router.push(`/review/new?venueId=${dish.venue}&dishId=${dish.id}`)
            }
            sx={{
              flex: 1,
              borderRadius: '48px',
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Write a Review
          </Button>
          <Link href={`/dish/compare?dishId=${dish.id}`} legacyBehavior passHref>
            <Button
              component="a"
              variant="outlined"
              sx={{
                flex: 1,
                borderRadius: '48px',
                py: 1.2,
                fontWeight: 700,
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  bgcolor: 'transparent',
                },
              }}
            >
              Compare
            </Button>
          </Link>
        </Stack>

        {/* Reviews */}
        <Box sx={{ mt: 3 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: 16, px: 2, mb: 1.5 }}
          >
            Reviews
          </Typography>
          {dishReviews.length === 0 ? (
            <Typography
              sx={{ px: 2, color: theme.palette.text.secondary, fontSize: 14 }}
            >
              No reviews for this dish yet.
            </Typography>
          ) : (
            dishReviews.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))
          )}
        </Box>
      </Box>
    </AppShell>
  );
}
