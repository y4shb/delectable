import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  Place as PlaceIcon,
  Restaurant as RestaurantIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { RecommendationCard, RecommendationCardSkeleton } from '../components/RecommendationCard';
import api from '../api/client';

type RecommendationType = 'personalized' | 'similar' | 'explore';

interface Recommendation {
  id: string;
  venueId: string;
  venueName: string;
  venueImageUrl: string | null;
  cuisineType: string;
  priceLevel: number;
  rating: number;
  reviewCount: number;
  distance: number | null;
  score: number;
  explanation: string;
  matchedPreferences: string[];
}

interface Filters {
  cuisine: string;
  priceLevel: string;
  distance: string;
}

async function fetchRecommendations(
  type: RecommendationType,
  filters: Filters
): Promise<Recommendation[]> {
  const params: Record<string, string> = { type };
  if (filters.cuisine) params.cuisine = filters.cuisine;
  if (filters.priceLevel) params.price_level = filters.priceLevel;
  if (filters.distance) params.max_distance = filters.distance;

  const { data } = await api.get('/ml/recommendations/', { params });
  return data.data ?? data.results ?? data;
}

const CUISINES = [
  'All',
  'Italian',
  'Japanese',
  'Mexican',
  'Indian',
  'Chinese',
  'Thai',
  'American',
  'Mediterranean',
  'Korean',
  'Vietnamese',
];

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<RecommendationType>('personalized');
  const [filters, setFilters] = useState<Filters>({
    cuisine: '',
    priceLevel: '',
    distance: '',
  });

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', activeTab, filters],
    queryFn: () => fetchRecommendations(activeTab, filters),
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: RecommendationType) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field: keyof Filters) => (event: SelectChangeEvent) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load recommendations</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <AIIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700}>
              For You
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab
            value="personalized"
            label="Personalized"
            icon={<AIIcon />}
            iconPosition="start"
          />
          <Tab
            value="similar"
            label="Similar to Liked"
            icon={<RestaurantIcon />}
            iconPosition="start"
          />
          <Tab
            value="explore"
            label="Explore"
            icon={<PlaceIcon />}
            iconPosition="start"
          />
        </Tabs>

        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Cuisine</InputLabel>
            <Select
              value={filters.cuisine}
              label="Cuisine"
              onChange={handleFilterChange('cuisine')}
            >
              <MenuItem value="">All</MenuItem>
              {CUISINES.filter((c) => c !== 'All').map((cuisine) => (
                <MenuItem key={cuisine} value={cuisine.toLowerCase()}>
                  {cuisine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Price</InputLabel>
            <Select
              value={filters.priceLevel}
              label="Price"
              onChange={handleFilterChange('priceLevel')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">$</MenuItem>
              <MenuItem value="2">$$</MenuItem>
              <MenuItem value="3">$$$</MenuItem>
              <MenuItem value="4">$$$$</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Distance</InputLabel>
            <Select
              value={filters.distance}
              label="Distance"
              onChange={handleFilterChange('distance')}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="1000">1 km</MenuItem>
              <MenuItem value="3000">3 km</MenuItem>
              <MenuItem value="5000">5 km</MenuItem>
              <MenuItem value="10000">10 km</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Active Filters */}
        {(filters.cuisine || filters.priceLevel || filters.distance) && (
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {filters.cuisine && (
              <Chip
                label={filters.cuisine}
                onDelete={() => setFilters((prev) => ({ ...prev, cuisine: '' }))}
                size="small"
              />
            )}
            {filters.priceLevel && (
              <Chip
                label={'$'.repeat(parseInt(filters.priceLevel))}
                onDelete={() => setFilters((prev) => ({ ...prev, priceLevel: '' }))}
                size="small"
              />
            )}
            {filters.distance && (
              <Chip
                label={`Within ${parseInt(filters.distance) / 1000}km`}
                onDelete={() => setFilters((prev) => ({ ...prev, distance: '' }))}
                size="small"
              />
            )}
          </Box>
        )}

        {/* Description */}
        <Box
          p={2}
          mb={3}
          borderRadius={2}
          bgcolor="primary.light"
          sx={{ opacity: 0.9 }}
        >
          <Typography variant="body2">
            {activeTab === 'personalized' &&
              'Venues picked just for you based on your taste profile, past reviews, and dining history.'}
            {activeTab === 'similar' &&
              'Discover venues similar to the ones you\'ve enjoyed and saved.'}
            {activeTab === 'explore' &&
              'Step outside your comfort zone with curated suggestions you might not have found otherwise.'}
          </Typography>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3].map((i) => (
              <RecommendationCardSkeleton key={i} />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && recommendations?.length === 0 && (
          <Alert severity="info">
            No recommendations found with the current filters. Try adjusting your filters or
            explore more venues to improve your recommendations.
          </Alert>
        )}

        {/* Recommendations */}
        {!isLoading && recommendations && recommendations.length > 0 && (
          <Box display="flex" flexDirection="column" gap={2}>
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </Box>
        )}
      </Container>
    </AppShell>
  );
}
