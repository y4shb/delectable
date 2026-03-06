import { Box, Skeleton, Card } from '@mui/material';

export default function ReviewCardSkeleton() {
  return (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 2 }}>
      {/* Photo skeleton */}
      <Skeleton variant="rectangular" height={280} animation="wave" />
      <Box sx={{ p: 2 }}>
        {/* User info row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="25%" height={16} />
          </Box>
          <Skeleton variant="text" width={50} height={20} />
        </Box>
        {/* Venue name */}
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
        {/* Rating */}
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
        {/* Review text */}
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="90%" height={16} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1.5 }} />
        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rounded" width={50} height={24} sx={{ borderRadius: '12px' }} />
        </Box>
      </Box>
    </Card>
  );
}
