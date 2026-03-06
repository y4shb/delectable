import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Skeleton,
  Alert,
  Button,
  Snackbar,
} from '@mui/material';
import {
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  Restaurant as RestaurantIcon,
  CameraAlt as CameraIcon,
  Favorite as HeartIcon,
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingIcon,
  Explore as ExploreIcon,
  Share as ShareIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import AppShell from '../layouts/AppShell';
import RecapCard from '../components/RecapCard';
import { useMonthlyRecap } from '../hooks/useApi';
import { useRequireAuth } from '../hooks/useRequireAuth';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

export default function MonthlyRecapPage() {
  useRequireAuth();
  const [currentCard, setCurrentCard] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Default to current month
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);

  const { data: recap, isLoading, error } = useMonthlyRecap(year, month);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const maxCardIndex = 4; // 5 cards total (0-4), updated dynamically below

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left -> next (wrap around like arrow buttons)
          setCurrentCard((prev) => (prev < maxCardIndex ? prev + 1 : 0));
        } else {
          // Swipe right -> prev (wrap around like arrow buttons)
          setCurrentCard((prev) => (prev > 0 ? prev - 1 : maxCardIndex));
        }
      }
    },
    [],
  );

  const handleShare = async () => {
    if (!recap) return;

    const shareText = `My ${recap.monthName} Recap on de.\n${recap.totalReviews} reviews | ${recap.totalVenues} venues | ${recap.xpEarned} XP earned\nTop cuisine: ${recap.topCuisine || 'Various'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recap.monthName} Recap`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setSnackbarOpen(true);
      } catch {
        // Clipboard not available
      }
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
        </Container>
      </AppShell>
    );
  }

  if (error || !recap) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="info">
            No recap data available for this month yet. Keep reviewing to build your stats!
          </Alert>
        </Container>
      </AppShell>
    );
  }

  const cards = [
    {
      title: `Your ${recap.monthName}`,
      icon: <RestaurantIcon sx={{ fontSize: 64 }} />,
      mainStat: recap.totalReviews,
      statLabel: 'reviews written',
      subtitle: `across ${recap.totalVenues} different venues`,
    },
    {
      title: 'Top Cuisine',
      icon: <ExploreIcon sx={{ fontSize: 64 }} />,
      mainStat: recap.topCuisine || 'Various',
      statLabel: 'was your go-to',
      subtitle: recap.newCuisinesTried > 0
        ? `You tried ${recap.newCuisinesTried} new cuisine${recap.newCuisinesTried > 1 ? 's' : ''}!`
        : 'Sticking to your favorites',
    },
    {
      title: 'Best Dish',
      icon: <StarIcon sx={{ fontSize: 64 }} />,
      mainStat: recap.topRatedDish || 'N/A',
      statLabel: 'top rated',
      subtitle: recap.topVenueName ? `at ${recap.topVenueName}` : undefined,
    },
    {
      title: 'Streak & XP',
      icon: <FireIcon sx={{ fontSize: 64 }} />,
      mainStat: recap.longestStreakInMonth,
      statLabel: 'day streak',
      subtitle: `${recap.xpEarned.toLocaleString()} XP earned this month`,
    },
    {
      title: 'Monthly Summary',
      icon: <HeartIcon sx={{ fontSize: 64 }} />,
      mainStat: recap.likesReceived,
      statLabel: 'likes received',
      subtitle: `${recap.totalPhotos} photos shared`,
    },
  ];

  const handlePrev = () => {
    setCurrentCard((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setCurrentCard((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  return (
    <AppShell>
      <Box
        sx={{
          minHeight: '100vh',
          background: CARD_GRADIENTS[currentCard % CARD_GRADIENTS.length],
          py: 4,
          transition: 'background 0.5s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Container maxWidth="sm">
          <Typography
            variant="h4"
            fontWeight={700}
            color="white"
            textAlign="center"
            mb={4}
            sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            de. {recap.monthName} Recap
          </Typography>

          <RecapCard
            index={currentCard}
            title={cards[currentCard].title}
            icon={cards[currentCard].icon}
            mainStat={cards[currentCard].mainStat}
            statLabel={cards[currentCard].statLabel}
            subtitle={cards[currentCard].subtitle}
            isActive={true}
          />

          {/* Navigation */}
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={4}>
            <IconButton
              onClick={handlePrev}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <LeftIcon />
            </IconButton>

            <Box display="flex" gap={1}>
              {cards.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: i === currentCard ? 'white' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: i === currentCard ? 'scale(1.3)' : 'scale(1)',
                  }}
                  onClick={() => setCurrentCard(i)}
                />
              ))}
            </Box>

            <IconButton
              onClick={handleNext}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <RightIcon />
            </IconButton>
          </Box>

          {/* Share button on last card */}
          {currentCard === cards.length - 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 8,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Share Your Recap
              </Button>
            </Box>
          )}

          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            mt={4}
            color="rgba(255,255,255,0.7)"
          >
            Swipe or tap arrows to navigate
          </Typography>
        </Container>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Recap copied to clipboard!"
      />
    </AppShell>
  );
}
