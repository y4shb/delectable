import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Groups,
  ContentCopy,
  Share,
  CalendarMonth,
  AccessTime,
  HowToVote,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useDinnerPlanDetail, useDinnerPlanResult } from '../../hooks/useApi';
import { submitDinnerPlanVotes } from '../../api/api';
import VenueSwipeCard from '../../components/VenueSwipeCard';
import DinnerPlanResult from '../../components/DinnerPlanResult';
import type { DinnerPlanVote } from '../../types';
import { useQueryClient } from '@tanstack/react-query';

export default function DinnerPlanDetailPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const { id } = router.query;
  const planId = typeof id === 'string' ? id : '';

  const { data: plan, isLoading, error: planError } = useDinnerPlanDetail(planId);
  const { data: result } = useDinnerPlanResult(
    plan?.status === 'decided' || (plan && plan.votedCount > 0) ? planId : undefined,
  );

  const queryClient = useQueryClient();
  const [currentVenueIndex, setCurrentVenueIndex] = useState(0);
  const [votes, setVotes] = useState<DinnerPlanVote[]>([]);
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [votingComplete, setVotingComplete] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmitVotes = useCallback(async (allVotes: DinnerPlanVote[]) => {
    if (!planId) return;
    setIsSubmittingVotes(true);
    setSubmitError('');

    try {
      await submitDinnerPlanVotes(planId, allVotes);
      setVotingComplete(true);
      // Refetch plan and result data
      queryClient.invalidateQueries({ queryKey: ['dinnerPlanDetail', planId] });
      queryClient.invalidateQueries({ queryKey: ['dinnerPlanResult', planId] });
    } catch (err: unknown) {
      setSubmitError('Failed to submit votes. Please try again.');
    } finally {
      setIsSubmittingVotes(false);
    }
  }, [planId, queryClient]);

  const handleVote = useCallback(
    (venueId: string, vote: 'yes' | 'no' | 'skip') => {
      const newVotes = [...votes, { venueId, vote }];
      setVotes(newVotes);

      const venueOptions = plan?.venueOptions ?? [];
      if (currentVenueIndex + 1 < venueOptions.length) {
        // Move to next card after a brief delay
        setTimeout(() => {
          setCurrentVenueIndex((prev) => prev + 1);
        }, 350);
      } else {
        // All venues voted on, submit
        handleSubmitVotes(newVotes);
      }
    },
    [votes, currentVenueIndex, plan, handleSubmitVotes],
  );

  const handleCopyCode = async () => {
    if (!plan) return;
    try {
      const link = `${window.location.origin}/dinner-plan/join?code=${plan.shareCode}`;
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
    } catch {
      setCopySuccess(true);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (planError || !plan) {
    return (
      <AppShell>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Dinner plan not found.
          </Typography>
          <Button
            onClick={() => router.push('/dinner-plan/new')}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Create a New Plan
          </Button>
        </Box>
      </AppShell>
    );
  }

  const hasVoted = plan.hasUserVoted || votingComplete;
  const showSwipeInterface = !hasVoted && plan.status === 'voting' && plan.venueOptions.length > 0;
  const showResult = (hasVoted || plan.status === 'decided') && result;

  return (
    <AppShell>
      <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 3 }}>
        {/* Plan Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {plan.title}
            </Typography>
            <Tooltip title="Copy invite link">
              <IconButton onClick={handleCopyCode} size="small">
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {plan.description && (
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>
              {plan.description}
            </Typography>
          )}

          {/* Meta info */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              size="small"
              label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              color={
                plan.status === 'voting'
                  ? 'warning'
                  : plan.status === 'decided'
                    ? 'success'
                    : plan.status === 'cancelled'
                      ? 'error'
                      : 'default'
              }
              variant="outlined"
            />
            {plan.cuisineFilter && (
              <Chip size="small" label={plan.cuisineFilter} variant="outlined" />
            )}
            {plan.suggestedDate && (
              <Chip
                size="small"
                icon={<CalendarMonth sx={{ fontSize: 16 }} />}
                label={new Date(plan.suggestedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                variant="outlined"
              />
            )}
            {plan.suggestedTime && (
              <Chip
                size="small"
                icon={<AccessTime sx={{ fontSize: 16 }} />}
                label={plan.suggestedTime}
                variant="outlined"
              />
            )}
          </Box>

          {/* Members */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AvatarGroup
              max={6}
              sx={{
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  borderWidth: 2,
                },
              }}
            >
              {plan.members.map((member) => (
                <Tooltip key={member.id} title={`${member.user.name}${member.hasVoted ? ' (voted)' : ''}`}>
                  <Avatar
                    src={member.user.avatarUrl}
                    sx={{
                      border: member.hasVoted
                        ? '2px solid #4CAF50 !important'
                        : undefined,
                    }}
                  >
                    {member.user.name?.[0]}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
            <Typography variant="body2" color="text.secondary">
              {plan.votedCount}/{plan.totalMembers} voted
            </Typography>
          </Box>
        </Box>

        {/* Swipe-to-vote interface */}
        {showSwipeInterface && !isSubmittingVotes && (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <HowToVote sx={{ fontSize: 28, color: '#F24D4F', mb: 0.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Swipe to Vote
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Right = Yes, Left = No, Up = Skip
              </Typography>
            </Box>
            <VenueSwipeCard
              venueOption={plan.venueOptions[currentVenueIndex]}
              currentIndex={currentVenueIndex}
              totalCount={plan.venueOptions.length}
              onVote={handleVote}
            />
          </Box>
        )}

        {/* Submitting votes */}
        {isSubmittingVotes && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#F24D4F', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Submitting your votes...
            </Typography>
          </Box>
        )}

        {/* Results */}
        {showResult && (
          <DinnerPlanResult result={result} members={plan.members} />
        )}

        {/* Waiting for others after voting */}
        {hasVoted && !showResult && plan.status !== 'decided' && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Groups sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Waiting for Others
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {plan.votedCount} of {plan.totalMembers} friends have voted.
              <br />
              Share the code so more friends can join!
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleCopyCode}
              sx={{
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#F24D4F',
                color: '#F24D4F',
                '&:hover': { borderColor: '#d93d3f', bgcolor: 'rgba(242,77,79,0.04)' },
              }}
            >
              Share Invite Code: {plan.shareCode}
            </Button>
          </Box>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {submitError}
          </Alert>
        )}

        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Invite link copied!
          </Alert>
        </Snackbar>
      </Box>
    </AppShell>
  );
}
