import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Fade, Slide } from '@mui/material';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import ComparisonCard from '../components/ComparisonCard';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useNextComparison, useSubmitComparison } from '../hooks/useApi';
import type { Venue, PersonalRanking } from '../types';

type SelectionState = 'choosing' | 'selected' | 'transitioning';

export default function ComparePage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const venueId = router.query.venueId as string | undefined;

  const {
    data: comparisonPair,
    isLoading: pairLoading,
    isError: pairError,
    refetch: refetchPair,
  } = useNextComparison(venueId);

  const submitMutation = useSubmitComparison();

  const [selectionState, setSelectionState] = useState<SelectionState>('choosing');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [updatedRankings, setUpdatedRankings] = useState<PersonalRanking[] | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);

  // Reset state when a new pair arrives
  useEffect(() => {
    setSelectionState('choosing');
    setWinnerId(null);
    setUpdatedRankings(null);
  }, [comparisonPair]);

  const handleSelect = useCallback(
    async (selectedVenue: Venue) => {
      if (!comparisonPair || selectionState !== 'choosing') return;

      const venueA = comparisonPair.venueA;
      const venueB = comparisonPair.venueB;

      setWinnerId(selectedVenue.id);
      setSelectionState('selected');

      try {
        const result = await submitMutation.mutateAsync({
          venueA: venueA.id,
          venueB: venueB.id,
          winner: selectedVenue.id,
        });
        setUpdatedRankings(result.updatedRankings);
        setComparisonCount((c) => c + 1);

        // Show result briefly, then load next pair
        setTimeout(() => {
          setSelectionState('transitioning');
          queryClient.invalidateQueries({ queryKey: ['personalRankings'] });
          setTimeout(() => {
            refetchPair();
          }, 300);
        }, 1200);
      } catch {
        setSelectionState('choosing');
        setWinnerId(null);
      }
    },
    [comparisonPair, selectionState, submitMutation, queryClient, refetchPair],
  );

  const handleTooTough = useCallback(async () => {
    if (!comparisonPair || selectionState !== 'choosing') return;

    setWinnerId(null);
    setSelectionState('selected');

    try {
      const result = await submitMutation.mutateAsync({
        venueA: comparisonPair.venueA.id,
        venueB: comparisonPair.venueB.id,
        winner: null,
      });
      setUpdatedRankings(result.updatedRankings);
      setComparisonCount((c) => c + 1);

      setTimeout(() => {
        setSelectionState('transitioning');
        queryClient.invalidateQueries({ queryKey: ['personalRankings'] });
        setTimeout(() => {
          refetchPair();
        }, 300);
      }, 1000);
    } catch {
      setSelectionState('choosing');
    }
  }, [comparisonPair, selectionState, submitMutation, queryClient, refetchPair]);

  const handleSkip = useCallback(() => {
    if (selectionState !== 'choosing') return;
    setSelectionState('transitioning');
    setTimeout(() => {
      refetchPair();
    }, 300);
  }, [selectionState, refetchPair]);

  if (authLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (pairLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
          <CircularProgress />
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            Finding your next matchup...
          </Typography>
        </Box>
      </AppShell>
    );
  }

  if (pairError || !comparisonPair) {
    return (
      <AppShell>
        <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Not enough reviews yet
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3, maxWidth: 300, mx: 'auto' }}>
            Review at least 2 restaurants to start building your personal rankings through head-to-head comparisons.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/review/quick')}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              background: 'linear-gradient(135deg, #F24D4F 0%, #FF6B6B 100%)',
            }}
          >
            Write a Review
          </Button>
        </Box>
      </AppShell>
    );
  }

  const { venueA, venueB } = comparisonPair;

  return (
    <AppShell>
      <Box sx={{ pb: 12, pt: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Which is better?
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            Tap the winner to build your personal rankings
          </Typography>
          {comparisonCount > 0 && (
            <Typography
              sx={{
                fontSize: 12,
                color: 'text.secondary',
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              {comparisonCount} comparison{comparisonCount !== 1 ? 's' : ''} this session
            </Typography>
          )}
        </Box>

        {/* Comparison cards */}
        <Fade in={selectionState !== 'transitioning'} timeout={300}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
              px: 1,
            }}
          >
            <ComparisonCard
              venue={venueA}
              onSelect={() => handleSelect(venueA)}
              isWinner={winnerId === venueA.id}
              isLoser={winnerId !== null && winnerId !== venueA.id}
              disabled={selectionState !== 'choosing'}
            />

            {/* VS divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'text.secondary',
                    letterSpacing: 1,
                  }}
                >
                  VS
                </Typography>
              </Box>
            </Box>

            <ComparisonCard
              venue={venueB}
              onSelect={() => handleSelect(venueB)}
              isWinner={winnerId === venueB.id}
              isLoser={winnerId !== null && winnerId !== venueB.id}
              disabled={selectionState !== 'choosing'}
            />
          </Box>
        </Fade>

        {/* Updated rankings preview */}
        {updatedRankings && selectionState === 'selected' && (
          <Slide direction="up" in={true} timeout={400}>
            <Box
              sx={{
                mx: 1,
                mb: 2,
                p: 2,
                borderRadius: '16px',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(242, 77, 79, 0.06)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(242, 77, 79, 0.15)',
              }}
            >
              <Typography
                sx={{ fontWeight: 700, fontSize: 14, mb: 1, color: 'text.primary' }}
              >
                Rankings Updated
              </Typography>
              {updatedRankings.map((ranking) => (
                <Box
                  key={ranking.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#F24D4F',
                        width: 24,
                        textAlign: 'center',
                      }}
                    >
                      #{ranking.rank}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {ranking.venueDetail?.name}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: 'text.secondary',
                    }}
                  >
                    {ranking.displayScore.toFixed(1)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Slide>
        )}

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            px: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<BalanceIcon />}
            onClick={handleTooTough}
            disabled={selectionState !== 'choosing'}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              fontSize: 13,
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.15)',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'transparent',
              },
            }}
          >
            Too tough
          </Button>

          <Button
            variant="outlined"
            startIcon={<SkipNextIcon />}
            onClick={handleSkip}
            disabled={selectionState !== 'choosing'}
            sx={{
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              fontSize: 13,
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.15)',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'transparent',
              },
            }}
          >
            Skip
          </Button>
        </Box>

        {/* Link to full rankings */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="text"
            onClick={() => router.push('/rankings')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#F24D4F',
              fontSize: 14,
            }}
          >
            View My Rankings
          </Button>
        </Box>
      </Box>
    </AppShell>
  );
}
