import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  LinearProgress,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import api from '../api/client';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface ReferralStats {
  inviteCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalXpEarned: number;
  currentTier: string;
  nextTier: string | null;
  progressToNextTier: number;
  referralsToNextTier: number;
}

interface Referral {
  id: string;
  referredUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  status: 'pending' | 'activated' | 'rewarded';
  xpEarned: number;
  createdAt: string;
}

const REWARD_TIERS = [
  { name: 'Bronze', minReferrals: 0, xpPerReferral: 100 },
  { name: 'Silver', minReferrals: 5, xpPerReferral: 150 },
  { name: 'Gold', minReferrals: 15, xpPerReferral: 200 },
  { name: 'Platinum', minReferrals: 30, xpPerReferral: 300 },
];

async function fetchReferralStats(): Promise<ReferralStats> {
  const { data } = await api.get('/sharing/referrals/stats/');
  return data;
}

async function fetchReferrals(): Promise<Referral[]> {
  const { data } = await api.get('/sharing/referrals/');
  return data.data ?? data.results ?? data;
}

export default function InvitePage() {
  useRequireAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: fetchReferralStats,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: fetchReferrals,
  });

  const inviteUrl = stats?.inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${stats.inviteCode}`
    : '';

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSnackbarMessage('Invite link copied!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    if (!inviteUrl || typeof navigator === 'undefined' || !navigator.share) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: 'Join me on Delectable!',
        text: 'Discover and share amazing food experiences with me on Delectable.',
        url: inviteUrl,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#CD7F32';
    }
  };

  if (statsLoading) {
    return (
      <AppShell>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <PersonAddIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Invite Friends
          </Typography>
        </Box>

        {/* Invite Link Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Your Invite Link
            </Typography>
            <TextField
              fullWidth
              value={inviteUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyLink} edge="end">
                      <CopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                fullWidth
              >
                Share Link
              </Button>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyLink}
                fullWidth
              >
                Copy
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Your Referrals
              </Typography>
              <Chip
                label={stats?.currentTier || 'Bronze'}
                sx={{
                  bgcolor: getTierColor(stats?.currentTier || 'Bronze'),
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </Box>

            <Box display="flex" justifyContent="space-around" mb={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stats?.completedReferrals || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Successful
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {stats?.pendingReferrals || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {stats?.totalXpEarned || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  XP Earned
                </Typography>
              </Box>
            </Box>

            {stats?.nextTier && (
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress to {stats.nextTier}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.referralsToNextTier} more referrals
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.progressToNextTier}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Reward Tiers */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrophyIcon color="warning" />
              <Typography variant="h6" fontWeight={700}>
                Reward Tiers
              </Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={1}>
              {REWARD_TIERS.map((tier) => (
                <Box
                  key={tier.name}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1.5}
                  borderRadius={2}
                  bgcolor={
                    stats?.currentTier === tier.name ? 'action.selected' : 'background.default'
                  }
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getTierColor(tier.name),
                      }}
                    />
                    <Typography fontWeight={stats?.currentTier === tier.name ? 700 : 400}>
                      {tier.name}
                    </Typography>
                    {stats?.currentTier === tier.name && (
                      <CheckIcon color="success" sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tier.minReferrals}+ referrals = {tier.xpPerReferral} XP each
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {!referralsLoading && referrals && referrals.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Recent Referrals
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {referrals.slice(0, 5).map((referral) => (
                  <Box
                    key={referral.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1}
                    borderRadius={1}
                    bgcolor="background.default"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {referral.referredUser.displayName.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {referral.referredUser.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {referral.status === 'rewarded' && (
                        <Chip
                          label={`+${referral.xpEarned} XP`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={referral.status}
                        size="small"
                        color={
                          referral.status === 'rewarded'
                            ? 'success'
                            : referral.status === 'activated'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {!referralsLoading && (!referrals || referrals.length === 0) && (
          <Alert severity="info">
            No referrals yet. Share your invite link to start earning rewards!
          </Alert>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    </AppShell>
  );
}
