import AppShell from '../layouts/AppShell';
import { Typography, Box, CircularProgress } from '@mui/material';
import ReviewCard from '../components/ReviewCard';
import WelcomeSection from '../components/WelcomeSection';
import TrendingSection from '../components/TrendingSection';
import TasteWizard from '../components/TasteWizard';
import { useState } from 'react';
import { useFeedReviews, useFeedTier, useTasteProfile } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useQueryClient } from '@tanstack/react-query';

export default function FeedPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState('top-picks');
  const { data: reviews, isLoading } = useFeedReviews(activeTab);
  const { data: feedTier } = useFeedTier();
  const { data: tasteProfile } = useTasteProfile();
  const queryClient = useQueryClient();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  // Show taste wizard for cold-start users who haven't completed it
  const showWizard =
    !wizardDismissed &&
    feedTier?.tier === 1 &&
    tasteProfile &&
    !tasteProfile.completedWizard;

  const handleWizardComplete = () => {
    setWizardDismissed(true);
    // Refetch feed data with new preferences
    queryClient.invalidateQueries({ queryKey: ['feedReviews'] });
    queryClient.invalidateQueries({ queryKey: ['tasteProfile'] });
    queryClient.invalidateQueries({ queryKey: ['feedTier'] });
  };

  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'none' }}>
        Feed
      </Typography>
      <Box
        sx={{
          width: '100vw',
          minHeight: '100vh',
          overflowY: 'auto',
          pb: 11, // enough to clear the floating BottomTabBar
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE 10+
          '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari/Opera
          mx: 'calc(-50vw + 50%)', // stretch to window edge
        }}
      >
        <WelcomeSection onTabChange={handleTabChange} />

        {/* Taste Wizard for cold-start users */}
        {showWizard && <TasteWizard onComplete={handleWizardComplete} />}

        {/* Trending section for Explore tab */}
        {activeTab === 'explore' && <TrendingSection />}

        {isLoading || authLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          (reviews ?? []).map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))
        )}
      </Box>
    </AppShell>
  );
}
