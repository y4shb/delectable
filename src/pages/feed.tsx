import AppShell from '../layouts/AppShell';
import { Typography, Box, CircularProgress } from '@mui/material';
import ReviewCard from '../components/ReviewCard';
import WelcomeSection from '../components/WelcomeSection';
import { useState } from 'react';
import { useFeedReviews } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';

export default function FeedPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState('top-picks');
  const { data: reviews, isLoading } = useFeedReviews(activeTab);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
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
        {isLoading || authLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          (reviews ?? []).map((review) => (
            <ReviewCard key={`${review.venue}-${review.date}`} {...review} />
          ))
        )}
      </Box>
    </AppShell>
  );
}
