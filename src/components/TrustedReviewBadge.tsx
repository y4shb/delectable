import { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

interface TrustedBadgeProps {
  reviewId: string;
  showDetails?: boolean;
  size?: 'small' | 'medium';
}

interface AuthenticityData {
  reviewId: string;
  authenticityScore: number;
  hasTrustedBadge: boolean;
  factors: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  lastUpdated: string;
}

async function fetchAuthenticityData(reviewId: string): Promise<AuthenticityData> {
  const { data } = await api.get(`/ml/reviews/${reviewId}/authenticity/`);
  return data;
}

export default function TrustedReviewBadge({
  reviewId,
  showDetails = false,
  size = 'small',
}: TrustedBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['review-authenticity', reviewId],
    queryFn: () => fetchAuthenticityData(reviewId),
    enabled: showDetails || dialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: badgeData } = useQuery({
    queryKey: ['trusted-badge', reviewId],
    queryFn: async () => {
      const { data } = await api.get(`/ml/reviews/${reviewId}/trusted-badge/`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!badgeData?.hasTrustedBadge) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Highly Trusted';
    if (score >= 0.8) return 'Trusted';
    if (score >= 0.7) return 'Verified';
    return 'Reviewed';
  };

  return (
    <>
      <Tooltip title="This review has been verified as authentic">
        <Chip
          icon={<VerifiedIcon />}
          label={size === 'small' ? 'Trusted' : 'Trusted Review'}
          size={size}
          color="success"
          variant="outlined"
          onClick={showDetails ? () => setDialogOpen(true) : undefined}
          sx={{
            cursor: showDetails ? 'pointer' : 'default',
            '& .MuiChip-icon': {
              color: 'success.main',
            },
          }}
        />
      </Tooltip>

      {showDetails && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ShieldIcon color="success" />
              <Typography variant="h6">Review Authenticity</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {isLoading ? (
              <Box py={3}>
                <LinearProgress />
              </Box>
            ) : data ? (
              <Box>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                  py={2}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: `${getScoreColor(data.authenticityScore)}.light`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={`${getScoreColor(data.authenticityScore)}.main`}
                    >
                      {Math.round(data.authenticityScore * 100)}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {getScoreLabel(data.authenticityScore)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Authenticity Score
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Trust Factors
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {data.factors.map((factor) => (
                    <Box key={factor.name}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{factor.name}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {Math.round(factor.score * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={factor.score * 100}
                        color={getScoreColor(factor.score)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {factor.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box
                  mt={2}
                  p={1.5}
                  borderRadius={1}
                  bgcolor="action.hover"
                  display="flex"
                  alignItems="flex-start"
                  gap={1}
                >
                  <InfoIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.25 }} />
                  <Typography variant="caption" color="text.secondary">
                    Our ML system analyzes multiple factors including reviewer history,
                    content quality, and engagement patterns to verify review authenticity.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Unable to load authenticity data
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
