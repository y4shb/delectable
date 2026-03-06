import AppShell from '../layouts/AppShell';
import { Typography, Box, CircularProgress } from '@mui/material';
import ReviewCard from '../components/ReviewCard';
import ReviewCardSkeleton from '../components/ReviewCardSkeleton';
import WelcomeSection from '../components/WelcomeSection';
import TrendingSection from '../components/TrendingSection';
import TasteWizard from '../components/TasteWizard';
import { useState, useRef, useCallback } from 'react';
import { useFeedReviews, useFeedTier, useTasteProfile } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useQueryClient } from '@tanstack/react-query';

const PULL_THRESHOLD = 80;
const RESISTANCE_FACTOR = 0.4;
const MIN_REFRESH_DURATION = 800;

export default function FeedPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState('top-picks');
  const { data: reviews, isLoading } = useFeedReviews(activeTab);
  const { data: feedTier } = useFeedTier();
  const { data: tasteProfile } = useTasteProfile();
  const queryClient = useQueryClient();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 5 && !refreshing) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current || refreshing) return;

    const currentY = e.touches[0].clientY;
    let distance = currentY - startYRef.current;

    if (distance < 0) {
      distance = 0;
    }

    // Apply rubber band resistance after threshold
    if (distance > PULL_THRESHOLD) {
      const excess = distance - PULL_THRESHOLD;
      distance = PULL_THRESHOLD + excess * RESISTANCE_FACTOR;
    }

    setPullDistance(distance);
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      const refreshStart = Date.now();
      queryClient.invalidateQueries({ queryKey: ['feedReviews'] }).then(() => {
        const elapsed = Date.now() - refreshStart;
        const remaining = Math.max(0, MIN_REFRESH_DURATION - elapsed);
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, remaining);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, queryClient]);

  const indicatorOpacity = refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1);
  const indicatorTranslateY = refreshing ? PULL_THRESHOLD : pullDistance;
  const isTransitioning = !pullingRef.current;

  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'none' }}>
        Feed
      </Typography>
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          width: '100%',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          maxWidth: '100vw',
          overflowX: 'hidden',
          minHeight: '100vh',
          overflowY: 'auto',
          pb: 11, // enough to clear the floating BottomTabBar
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE 10+
          '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari/Opera
        }}
      >
        {/* Pull-to-refresh indicator */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 0,
            overflow: 'visible',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              transform: `translateY(${indicatorTranslateY - 40}px)`,
              transition: isTransitioning
                ? 'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease'
                : 'none',
              opacity: indicatorOpacity,
            }}
          >
            <CircularProgress
              size={28}
              sx={{
                color: 'primary.main',
              }}
            />
          </Box>
        </Box>

        <WelcomeSection onTabChange={handleTabChange} />

        {/* Taste Wizard for cold-start users */}
        {showWizard && <TasteWizard onComplete={handleWizardComplete} />}

        {/* Trending section for Explore tab */}
        {activeTab === 'explore' && <TrendingSection />}

        {isLoading || authLoading ? (
          <Box>
            {[...Array(3)].map((_, i) => <ReviewCardSkeleton key={i} />)}
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
