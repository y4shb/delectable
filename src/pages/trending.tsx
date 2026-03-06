import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Alert,
  Rating,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Restaurant as RestaurantIcon,
  RateReview as ReviewIcon,
  Place as PlaceIcon,
  Whatshot as HotIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import AppShell from '../layouts/AppShell';
import VenueCardSkeleton from '../components/VenueCardSkeleton';
import api from '../api/client';
import { useRequireAuth } from '../hooks/useRequireAuth';

type TrendingType = 'venue' | 'review' | 'dish';

interface TrendingItem {
  id: string;
  type: TrendingType;
  rank: number;
  trendScore: number;
  velocityChange: number;
  venue?: {
    id: string;
    name: string;
    imageUrl: string | null;
    cuisineType: string;
    rating: number;
    reviewCount: number;
  };
  review?: {
    id: string;
    text: string;
    imageUrl: string | null;
    rating: number;
    authorName: string;
    venueName: string;
  };
  dish?: {
    name: string;
    mentionCount: number;
    venues: string[];
  };
}

async function fetchTrending(type: TrendingType): Promise<TrendingItem[]> {
  const { data } = await api.get('/ml/trending/', { params: { type } });
  return data.data ?? data.results ?? data;
}

export default function TrendingPage() {
  useRequireAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TrendingType>('venue');

  const { data: trendingItems, isLoading, error } = useQuery({
    queryKey: ['trending', activeTab],
    queryFn: () => fetchTrending(activeTab),
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: TrendingType) => {
    setActiveTab(newValue);
  };

  const getVelocityColor = (change: number) => {
    if (change > 50) return 'error';
    if (change > 20) return 'warning';
    return 'success';
  };

  const handleItemClick = (item: TrendingItem) => {
    if (item.type === 'venue' && item.venue) {
      router.push(`/venue/${item.venue.id}`);
    } else if (item.type === 'review' && item.review) {
      router.push(`/review/${item.review.id}`);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 1 }} />
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {[...Array(4)].map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </Box>
        </Container>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load trending items</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <TrendingIcon color="error" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Trending Now
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab
            value="venue"
            label="Venues"
            icon={<RestaurantIcon />}
            iconPosition="start"
          />
          <Tab
            value="review"
            label="Reviews"
            icon={<ReviewIcon />}
            iconPosition="start"
          />
          <Tab
            value="dish"
            label="Dishes"
            icon={<PlaceIcon />}
            iconPosition="start"
          />
        </Tabs>

        {trendingItems?.length === 0 && (
          <Alert severity="info">No trending items found. Check back later!</Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          {trendingItems?.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleItemClick(item)}
              sx={{
                display: 'flex',
                cursor: item.type !== 'dish' ? 'pointer' : 'default',
                '&:hover': item.type !== 'dish' ? { bgcolor: 'action.hover' } : {},
              }}
            >
              <Box
                sx={{
                  width: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Typography variant="h5" fontWeight={700}>
                  {item.rank}
                </Typography>
              </Box>

              {item.type === 'venue' && item.venue?.imageUrl && (
                <CardMedia
                  component="img"
                  sx={{ width: 100 }}
                  image={item.venue.imageUrl}
                  alt={item.venue.name}
                />
              )}

              {item.type === 'review' && item.review?.imageUrl && (
                <CardMedia
                  component="img"
                  sx={{ width: 100 }}
                  image={item.review.imageUrl}
                  alt="Review"
                />
              )}

              <CardContent sx={{ flex: 1 }}>
                {item.type === 'venue' && item.venue && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" fontWeight={700}>
                        {item.venue.name}
                      </Typography>
                      <Chip
                        icon={<HotIcon />}
                        label={`+${item.velocityChange}%`}
                        size="small"
                        color={getVelocityColor(item.velocityChange)}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label={item.venue.cuisineType} size="small" variant="outlined" />
                      <Rating value={item.venue.rating / 2} precision={0.5} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        ({item.venue.reviewCount} reviews)
                      </Typography>
                    </Box>
                  </>
                )}

                {item.type === 'review' && item.review && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.review.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          at {item.review.venueName}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<HotIcon />}
                        label={`+${item.velocityChange}%`}
                        size="small"
                        color={getVelocityColor(item.velocityChange)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                      {item.review.text}
                    </Typography>
                  </>
                )}

                {item.type === 'dish' && item.dish && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" fontWeight={700}>
                        {item.dish.name}
                      </Typography>
                      <Chip
                        icon={<HotIcon />}
                        label={`+${item.velocityChange}%`}
                        size="small"
                        color={getVelocityColor(item.velocityChange)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.dish.mentionCount} mentions across {item.dish.venues.length} venues
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </AppShell>
  );
}
