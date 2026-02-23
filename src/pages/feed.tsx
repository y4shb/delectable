import AppShell from '../layouts/AppShell';
import { Typography, Box } from '@mui/material';
import ReviewCard from '../components/ReviewCard';
import WelcomeSection from '../components/WelcomeSection';
import { useState } from 'react';
import { mockFeedReviews } from '../api/mockApi';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState('top-picks');

  // Filter reviews based on active tab
  const getFilteredReviews = () => {
    switch (activeTab) {
      case 'top-picks':
        return mockFeedReviews.filter(review => review.rating >= 9.5);
      case 'recent':
        return mockFeedReviews.filter(review => review.date.includes('h ago') || review.date.includes('1d ago'));
      case 'collections':
        return mockFeedReviews.filter(review => review.tags.some(tag => ['Coffee', 'Desserts', 'Group Dinner'].includes(tag)));
      case 'explore':
        return mockFeedReviews;
      default:
        return mockFeedReviews;
    }
  };

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
        {getFilteredReviews().map((review, i) => (
          <ReviewCard key={i} {...review} />
        ))}
      </Box>
    </AppShell>
  );
}
