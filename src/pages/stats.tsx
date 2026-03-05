import { Box, Container, Typography, Grid, Skeleton, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import XPProgressBar from '../components/XPProgressBar';
import StreakDisplay from '../components/StreakDisplay';
import ActivityGrid from '../components/ActivityGrid';
import BadgeShelf from '../components/BadgeShelf';
import Leaderboard from '../components/Leaderboard';
import {
  fetchUserXP,
  fetchDiningStreak,
  fetchActivityGrid,
  fetchUserBadges,
  fetchUserStats,
} from '../api/api';

export default function StatsPage() {
  const { data: xp, isLoading: xpLoading } = useQuery({
    queryKey: ['userXP'],
    queryFn: fetchUserXP,
  });

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['diningStreak'],
    queryFn: fetchDiningStreak,
  });

  const { data: activityGrid, isLoading: gridLoading } = useQuery({
    queryKey: ['activityGrid'],
    queryFn: () => fetchActivityGrid(52),
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['userBadges'],
    queryFn: fetchUserBadges,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
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
