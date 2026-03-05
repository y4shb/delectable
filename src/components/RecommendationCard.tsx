import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Rating,
  Skeleton,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

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

interface RecommendationCardProps {
  recommendation: Recommendation;
  compact?: boolean;
}

export function RecommendationCard({ recommendation, compact = false }: RecommendationCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/venue/${recommendation.venueId}`);
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (compact) {
    return (
      <Card
        onClick={handleClick}
        sx={{
          display: 'flex',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {recommendation.venueImageUrl && (
          <CardMedia
            component="img"
            sx={{ width: 80, height: 80 }}
            image={recommendation.venueImageUrl}
            alt={recommendation.venueName}
          />
        )}
        <CardContent sx={{ flex: 1, py: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {recommendation.venueName}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Rating value={recommendation.rating / 2} precision={0.5} size="small" readOnly />
            <Typography variant="caption" color="text.secondary">
              ({recommendation.reviewCount})
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {recommendation.explanation}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {recommendation.venueImageUrl && (
        <CardMedia
          component="img"
          height={160}
          image={recommendation.venueImageUrl}
          alt={recommendation.venueName}
        />
      )}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" fontWeight={700}>
            {recommendation.venueName}
          </Typography>
          <Chip
            icon={<AIIcon />}
            label={`${Math.round(recommendation.score * 100)}% match`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Rating value={recommendation.rating / 2} precision={0.5} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">
            ({recommendation.reviewCount} reviews)
          </Typography>
          {recommendation.distance && (
            <Box display="flex" alignItems="center" gap={0.25}>
              <PlaceIcon sx={{ fontSize: 14 }} color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDistance(recommendation.distance)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box display="flex" gap={0.5} mb={1.5} flexWrap="wrap">
          <Chip label={recommendation.cuisineType} size="small" variant="outlined" />
          <Chip label={'$'.repeat(recommendation.priceLevel)} size="small" variant="outlined" />
        </Box>

        <Box
          p={1.5}
          borderRadius={2}
          bgcolor="primary.light"
          sx={{ opacity: 0.9 }}
        >
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <AIIcon sx={{ fontSize: 16 }} color="primary" />
            <Typography variant="caption" fontWeight={600} color="primary.main">
              Why we recommend this
            </Typography>
          </Box>
          <Typography variant="body2">
            {recommendation.explanation}
          </Typography>
        </Box>

        {recommendation.matchedPreferences.length > 0 && (
          <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap">
            {recommendation.matchedPreferences.map((pref) => (
              <Chip
                key={pref}
                label={pref}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <Card>
      <Skeleton variant="rectangular" height={160} />
      <CardContent>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="40%" />
        <Box display="flex" gap={0.5} my={1}>
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={40} height={24} />
        </Box>
        <Skeleton variant="rounded" height={60} />
      </CardContent>
    </Card>
  );
}
