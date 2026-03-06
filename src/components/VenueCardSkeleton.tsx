import { Box, Skeleton } from '@mui/material';

export default function VenueCardSkeleton() {
  return (
    <Box sx={{ width: 200, flexShrink: 0 }}>
      <Skeleton variant="rounded" width={200} height={140} sx={{ borderRadius: '16px', mb: 1 }} animation="wave" />
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="50%" height={16} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
  );
}
