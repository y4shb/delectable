import dynamic from 'next/dynamic';
import { Box, Container, Typography, Grid, Skeleton, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import XPProgressBar from '../components/XPProgressBar';
import StreakDisplay from '../components/StreakDisplay';
const ActivityGrid = dynamic(() => import('../components/ActivityGrid'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />,
});
const BadgeShelf = dynamic(() => import('../components/BadgeShelf'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />,
});
const Leaderboard = dynamic(() => import('../components/Leaderboard'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />,
});
import {
  fetchUserXP,
  fetchDiningStreak,
  fetchActivityGrid,
  fetchUserBadges,
  fetchUserStats,
} from '../api/api';
import { useRequireAuth } from '../hooks/useRequireAuth';

export default function StatsPage() {
  useRequireAuth();
  const { data: xp, isLoading: xpLoading } = useQuery({
    queryKey: ['userXP'],
    queryFn: fetchUserXP,
    staleTime: 60_000,
  });

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['diningStreak'],
    queryFn: fetchDiningStreak,
    staleTime: 60_000,
  });

  const { data: activityGrid, isLoading: gridLoading } = useQuery({
    queryKey: ['activityGrid'],
    queryFn: () => fetchActivityGrid(52),
    staleTime: 5 * 60 * 1000,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['userBadges'],
    queryFn: fetchUserBadges,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = xpLoading || streakLoading || gridLoading || badgesLoading || statsLoading;

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Your Stats
        </Typography>

        {isLoading ? (
          <Box>
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {/* XP and Level */}
            {xp && <XPProgressBar xp={xp} />}

            {/* Quick Stats */}
            {stats && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard label="Reviews" value={stats.totalReviews} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard label="Venues" value={stats.totalVenues} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard label="Photos" value={stats.totalPhotos} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard label="Likes" value={stats.totalLikesReceived} />
                </Grid>
              </Grid>
            )}

            {/* Streak */}
            {streak && <StreakDisplay streak={streak} />}

            {/* Activity Grid */}
            {activityGrid && <ActivityGrid data={activityGrid} />}

            {/* Badges */}
            {badges && badges.length > 0 && (
              <BadgeShelf badges={badges} maxDisplay={12} />
            )}

            {/* Leaderboard */}
            <Leaderboard />
          </Box>
        )}
      </Container>
    </AppShell>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h5" fontWeight={700}>
        {value.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
