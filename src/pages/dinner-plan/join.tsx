import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  AvatarGroup,
  Chip,
} from '@mui/material';
import {
  Groups,
  Login,
  Restaurant,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import AppShell from '../../layouts/AppShell';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { joinDinnerPlan } from '../../api/api';
import type { DinnerPlan } from '../../types';

export default function JoinDinnerPlanPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const { code: queryCode } = router.query;

  const [shareCode, setShareCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [planPreview, setPlanPreview] = useState<DinnerPlan | null>(null);
  const autoJoinAttempted = useRef(false);

  const handleJoin = useCallback(async (code?: string) => {
    const codeToUse = (code || shareCode).trim().toUpperCase();
    if (!codeToUse) {
      setError('Please enter a share code.');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const plan = await joinDinnerPlan(codeToUse);
      setPlanPreview(plan);

      // Redirect to the plan detail page after a short delay
      setTimeout(() => {
        router.push(`/dinner-plan/${plan.id}`);
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid share code or plan not found.';
      setError(message);
    } finally {
      setIsJoining(false);
    }
  }, [shareCode, router]);

  // Auto-fill from URL query param
  useEffect(() => {
    if (typeof queryCode === 'string' && queryCode) {
      setShareCode(queryCode.toUpperCase());
    }
  }, [queryCode]);

  // Auto-join if code is provided via URL
  useEffect(() => {
    if (typeof queryCode === 'string' && queryCode && !authLoading && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      handleJoin(queryCode);
    }
  }, [queryCode, authLoading, handleJoin]);

  if (authLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  // Show success state
  if (planPreview) {
    return (
      <AppShell>
        <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Groups sx={{ fontSize: 40, color: '#4CAF50' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              You're In!
            </Typography>
            <Typography color="text.secondary">
              You've joined the dinner plan. Redirecting...
            </Typography>
          </Box>

          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {planPreview.title}
            </Typography>
            {planPreview.description && (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {planPreview.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {planPreview.cuisineFilter && (
                <Chip
                  size="small"
                  icon={<Restaurant sx={{ fontSize: 16 }} />}
                  label={planPreview.cuisineFilter}
                  variant="outlined"
                />
              )}
              <Chip
                size="small"
                label={`${planPreview.totalMembers} members`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${planPreview.venueOptions.length} venues to vote on`}
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <AvatarGroup
                max={8}
                sx={{
                  '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 },
                }}
              >
                {planPreview.members.map((member) => (
                  <Avatar key={member.id} src={member.user.avatarUrl}>
                    {member.user.name?.[0]}
                  </Avatar>
                ))}
              </AvatarGroup>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#F24D4F' }} />
          </Box>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(242, 77, 79, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Login sx={{ fontSize: 36, color: '#F24D4F' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Join a Dinner Plan
          </Typography>
          <Typography color="text.secondary">
            Enter the share code to join your friends' dinner plan.
          </Typography>
        </Box>

        {/* Code Input */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Share Code"
            placeholder="e.g. ABCD1234"
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value.toUpperCase())}
            fullWidth
            inputProps={{
              maxLength: 8,
              style: {
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 4,
                fontFamily: 'monospace',
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={
              isJoining ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Groups />
              )
            }
            onClick={() => handleJoin()}
            disabled={isJoining || !shareCode.trim()}
            fullWidth
            sx={{
              bgcolor: '#F24D4F',
              borderRadius: '48px',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              fontSize: 16,
              '&:hover': { bgcolor: '#d93d3f' },
            }}
          >
            {isJoining ? 'Joining...' : 'Join Plan'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Don't have a code?
            </Typography>
            <Button
              variant="text"
              onClick={() => router.push('/dinner-plan/new')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: '#F24D4F',
              }}
            >
              Create Your Own Plan
            </Button>
          </Box>
        </Box>
      </Box>
    </AppShell>
  );
}
