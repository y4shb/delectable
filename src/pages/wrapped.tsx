import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  Restaurant as RestaurantIcon,
  CameraAlt as CameraIcon,
  Favorite as HeartIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { fetchWrappedStats } from '../api/api';
import { useRequireAuth } from '../hooks/useRequireAuth';

const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
];

export default function WrappedPage() {
  useRequireAuth();
  const [currentCard, setCurrentCard] = useState(0);
  const year = new Date().getFullYear() - 1;

  const { data: wrapped, isLoading, error } = useQuery({
    queryKey: ['wrapped', year],
    queryFn: () => fetchWrappedStats(year),
  });

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
        </Container>
      </AppShell>
    );
  }

  if (error || !wrapped) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="info">
            Your {year} Wrapped isn&apos;t available yet. Check back after the year ends!
          </Alert>
        </Container>
      </AppShell>
    );
  }

  const cards = [
    {
      title: 'Your Year in Food',
      icon: <RestaurantIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.totalReviews,
      label: 'reviews written',
      subtitle: `across ${wrapped.totalVenues} different venues`,
    },
    {
      title: 'Captured Moments',
      icon: <CameraIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.totalPhotos,
      label: 'food photos shared',
      subtitle: 'Every dish tells a story',
    },
    {
      title: 'The Love',
      icon: <HeartIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.totalLikesReceived,
      label: 'likes received',
      subtitle: `and ${wrapped.totalCommentsReceived} comments`,
    },
    {
      title: 'Your Best Streak',
      icon: <FireIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.longestStreak,
      label: 'day streak',
      subtitle: 'Consistency is key!',
    },
    {
      title: 'Badges Earned',
      icon: <TrophyIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.badgesEarned,
      label: 'new badges',
      subtitle: `You gained ${wrapped.levelsGained} levels`,
    },
    {
      title: 'Favorite Cuisine',
      icon: <RestaurantIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.topCuisine || 'Various',
      label: 'was your go-to',
      subtitle: `Top spot: ${wrapped.topVenue || 'Your favorites'}`,
    },
    {
      title: 'Total XP',
      icon: <TrendingIcon sx={{ fontSize: 64 }} />,
      stat: wrapped.totalXp.toLocaleString(),
      label: 'XP earned',
      subtitle: `What a year!`,
    },
  ];

  const handlePrev = () => {
    setCurrentCard((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setCurrentCard((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  const card = cards[currentCard];

  return (
    <AppShell>
      <Box
        sx={{
          minHeight: '100vh',
          background: CARD_BACKGROUNDS[currentCard % CARD_BACKGROUNDS.length],
          py: 4,
        }}
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
            de. Wrapped {year}
          </Typography>

          <Card
            sx={{
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>{card.icon}</Box>

              <Typography variant="h6" color="text.secondary" gutterBottom>
                {card.title}
              </Typography>

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  background: CARD_BACKGROUNDS[currentCard % CARD_BACKGROUNDS.length],
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  my: 2,
                }}
              >
                {card.stat}
              </Typography>

              <Typography variant="h5" fontWeight={600} gutterBottom>
                {card.label}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {card.subtitle}
              </Typography>
            </CardContent>
          </Card>

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
    </AppShell>
  );
}
