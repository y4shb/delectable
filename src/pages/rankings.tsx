import { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Avatar,
  LinearProgress,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import AppShell from '../layouts/AppShell';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { usePersonalRankings } from '../hooks/useApi';

export default function RankingsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [showFull, setShowFull] = useState(false);
  const { data: rankingsData, isLoading } = usePersonalRankings(showFull, 10);

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const rankings = rankingsData?.data ?? [];
  const meta = rankingsData?.meta ?? { totalVenues: 0, totalComparisons: 0 };

  if (rankings.length === 0) {
    return (
      <AppShell>
        <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: '#FFD36E', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Your Personal Rankings
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 14, mb: 3, maxWidth: 320, mx: 'auto' }}
          >
            Compare restaurants head-to-head to build your personal top 10. Your rankings are
            unique to you, powered by an Elo rating system.
          </Typography>
          <Link href="/compare" legacyBehavior passHref>
            <Button
              component="a"
              variant="contained"
              startIcon={<CompareArrowsIcon />}
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                background: 'linear-gradient(135deg, #F24D4F 0%, #FF6B6B 100%)',
              }}
            >
              Start Comparing
            </Button>
          </Link>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box sx={{ pb: 12, pt: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            My Rankings
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
            {meta.totalVenues} venue{meta.totalVenues !== 1 ? 's' : ''} ranked
            {' / '}
            {meta.totalComparisons} comparison{meta.totalComparisons !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Start comparing CTA */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Link href="/compare" legacyBehavior passHref>
            <Button
              component="a"
              variant="contained"
              startIcon={<CompareArrowsIcon />}
              size="small"
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: 'linear-gradient(135deg, #F24D4F 0%, #FF6B6B 100%)',
              }}
            >
              Compare More
            </Button>
          </Link>
        </Box>

        {/* Rankings list */}
        <Box sx={{ px: 1 }}>
          {rankings.map((ranking, index) => {
            const isTopThree = ranking.rank <= 3;
            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const medalColor = isTopThree ? medalColors[ranking.rank - 1] : undefined;

            return (
              <Box
                key={ranking.id}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  mb: 1,
                  borderRadius: '16px',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : theme.palette.background.paper,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? 'none'
                      : isTopThree
                        ? '0 2px 12px rgba(242, 77, 79, 0.1)'
                        : '0 1px 6px rgba(0,0,0,0.05)',
                  border: isTopThree
                    ? `1px solid ${medalColor}33`
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                })}
              >
                {/* Rank number */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isTopThree
                      ? `linear-gradient(135deg, ${medalColor}, ${medalColor}88)`
                      : 'transparent',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: isTopThree ? 16 : 15,
                      color: isTopThree ? '#fff' : 'text.secondary',
                    }}
                  >
                    {ranking.rank}
                  </Typography>
                </Box>

                {/* Venue photo */}
                <Avatar
                  src={ranking.venueDetail?.photoUrl}
                  variant="rounded"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    flexShrink: 0,
                  }}
                >
                  <StarIcon sx={{ fontSize: 20 }} />
                </Avatar>

                {/* Venue info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 15,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ranking.venueDetail?.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: 'text.secondary',
                      lineHeight: 1.3,
                    }}
                  >
                    {ranking.venueDetail?.cuisineType}
                    {ranking.venueDetail?.cuisineType && ranking.venueDetail?.locationText
                      ? ' \u00B7 '
                      : ''}
                    {ranking.venueDetail?.locationText}
                  </Typography>

                  {/* Confidence bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={ranking.confidence * 100}
                      sx={{
                        height: 3,
                        borderRadius: 2,
                        flex: 1,
                        maxWidth: 60,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          bgcolor: ranking.confidence > 0.7 ? '#4caf50' : '#F24D4F',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {Math.round(ranking.confidence * 100)}%
                    </Typography>
                  </Box>
                </Box>

                {/* Score */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 20,
                      color: '#F24D4F',
                      lineHeight: 1,
                    }}
                  >
                    {ranking.displayScore.toFixed(1)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {ranking.comparisonCount} cmp{ranking.comparisonCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Show full list toggle */}
        {!showFull && meta.totalVenues > 10 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={() => setShowFull(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#F24D4F',
                fontSize: 14,
              }}
            >
              Show all {meta.totalVenues} venues
            </Button>
          </Box>
        )}
        {showFull && meta.totalVenues > 10 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={() => setShowFull(false)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: 14,
              }}
            >
              Show top 10 only
            </Button>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
