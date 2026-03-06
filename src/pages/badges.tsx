import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Skeleton,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { BadgeCard } from '../components/BadgeShelf';
import { fetchBadgeDefinitions, fetchUserBadges } from '../api/api';
import { useRequireAuth } from '../hooks/useRequireAuth';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'explorer', label: 'Explorer' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'social', label: 'Social' },
  { value: 'streak', label: 'Streak' },
  { value: 'foodie', label: 'Foodie' },
  { value: 'curator', label: 'Curator' },
  { value: 'local', label: 'Local' },
];

export default function BadgesPage() {
  useRequireAuth();
  const [category, setCategory] = useState('all');
  const [showUnlocked, setShowUnlocked] = useState<boolean | null>(null);

  const { data: allBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: fetchBadgeDefinitions,
  });

  const { data: userBadges, isLoading: userBadgesLoading } = useQuery({
    queryKey: ['userBadges'],
    queryFn: fetchUserBadges,
  });

  const isLoading = badgesLoading || userBadgesLoading;

  // Create a map of user badge progress
  const userBadgeMap = new Map(
    userBadges?.map((ub) => [ub.badge.id, ub]) ?? []
  );

  // Filter badges
  const filteredBadges = allBadges?.filter((badge) => {
    if (category !== 'all' && badge.category !== category) return false;

    if (showUnlocked !== null) {
      const userBadge = userBadgeMap.get(badge.id);
      const isUnlocked = userBadge?.isUnlocked ?? false;
      if (showUnlocked && !isUnlocked) return false;
      if (!showUnlocked && isUnlocked) return false;
    }

    return true;
  });

  // Stats
  const unlockedCount = userBadges?.filter((ub) => ub.isUnlocked).length ?? 0;
  const totalCount = allBadges?.length ?? 0;

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Badges
          </Typography>
          <Chip
            label={`${unlockedCount} / ${totalCount} Unlocked`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={category}
            onChange={(_, val) => setCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {CATEGORIES.map((cat) => (
              <Tab key={cat.value} value={cat.value} label={cat.label} />
            ))}
          </Tabs>
        </Box>

        <Box display="flex" gap={1} mb={3}>
          <Chip
            label="All"
            variant={showUnlocked === null ? 'filled' : 'outlined'}
            onClick={() => setShowUnlocked(null)}
          />
          <Chip
            label="Unlocked"
            variant={showUnlocked === true ? 'filled' : 'outlined'}
            color={showUnlocked === true ? 'success' : 'default'}
            onClick={() => setShowUnlocked(true)}
          />
          <Chip
            label="Locked"
            variant={showUnlocked === false ? 'filled' : 'outlined'}
            onClick={() => setShowUnlocked(false)}
          />
        </Box>

        {isLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid size={{ xs: 12, sm: 6 }} key={i}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {filteredBadges?.map((badge) => (
              <Grid size={{ xs: 12, sm: 6 }} key={badge.id}>
                <BadgeCard badge={badge} userBadge={userBadgeMap.get(badge.id)} />
              </Grid>
            ))}
          </Grid>
        )}

        {!isLoading && filteredBadges?.length === 0 && (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary">
              No badges found for this filter.
            </Typography>
          </Box>
        )}
      </Container>
    </AppShell>
  );
}
