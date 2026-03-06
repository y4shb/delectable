import { useState } from 'react';
import {
  Avatar,
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useChallenges, useChallengeLeaderboard } from '../hooks/useApi';
import { joinChallenge as joinChallengeApi } from '../api/api';
import type { Challenge, ChallengeParticipant } from '../types';

export default function ChallengesPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const { data: challenges, isLoading, error } = useChallenges();

  const { data: leaderboard } = useChallengeLeaderboard(selectedChallenge?.id);

  const joinMutation = useMutation({
    mutationFn: joinChallengeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setSelectedChallenge(null);
    },
  });

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={700} mb={3}>
            Food Challenges
          </Typography>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={260}
              sx={{ mb: 3, borderRadius: '20px' }}
            />
          ))}
        </Container>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load challenges</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <TrophyIcon sx={{ fontSize: 32, color: '#F24D4F' }} />
          <Typography variant="h4" fontWeight={700}>
            Food Challenges
          </Typography>
        </Box>

        {challenges?.length === 0 && (
          <Box textAlign="center" py={8}>
            <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>
              No active challenges right now
            </Typography>
            <Typography color="text.secondary">
              Check back soon for new food challenges!
            </Typography>
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          {challenges?.map((challenge) => {
            const progressPercent =
              challenge.userProgress && challenge.userProgress.target > 0
                ? Math.min(
                    (challenge.userProgress.progress / challenge.userProgress.target) * 100,
                    100,
                  )
                : 0;

            return (
              <Card
                key={challenge.id}
                sx={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                {/* Cover image */}
                {challenge.coverImageUrl && (
                  <Box
                    sx={{
                      position: 'relative',
                      height: 160,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src={challenge.coverImageUrl}
                      alt={challenge.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background:
                          'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 16,
                        right: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: '#fff' }}
                      >
                        {challenge.title}
                      </Typography>
                      <Chip
                        icon={<TrophyIcon sx={{ color: '#fff !important' }} />}
                        label={`${challenge.xpReward} XP`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(242,77,79,0.9)',
                          color: '#fff',
                          fontWeight: 700,
                          '& .MuiChip-icon': { color: '#fff' },
                        }}
                      />
                    </Box>
                  </Box>
                )}

                <CardContent sx={{ p: 2.5 }}>
                  {/* Title (only when no cover image) */}
                  {!challenge.coverImageUrl && (
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {challenge.title}
                      </Typography>
                      <Chip
                        icon={<TrophyIcon />}
                        label={`${challenge.xpReward} XP`}
                        size="small"
                        sx={{
                          bgcolor: '#F24D4F',
                          color: '#fff',
                          fontWeight: 700,
                          '& .MuiChip-icon': { color: '#fff' },
                        }}
                      />
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {challenge.description}
                  </Typography>

                  {/* Meta info */}
                  <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TimerIcon sx={{ fontSize: 16, color: '#F24D4F' }} />
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        {getDaysRemaining(challenge.endDate)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon sx={{ fontSize: 16, color: '#F24D4F' }} />
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        {challenge.participantCount} participants
                      </Typography>
                    </Box>
                    {challenge.cuisineFilter && (
                      <Chip
                        label={challenge.cuisineFilter}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: '12px' }}
                      />
                    )}
                  </Box>

                  {/* Progress bar */}
                  {challenge.userProgress && (
                    <Box mb={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          {challenge.userProgress.progress} /{' '}
                          {challenge.userProgress.target}
                        </Typography>
                        {challenge.userProgress.completed && (
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: 14 }} />}
                            label="Completed!"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(76,175,80,0.12)',
                              color: '#4caf50',
                              fontWeight: 700,
                              height: 24,
                            }}
                          />
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progressPercent}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'rgba(242,77,79,0.12)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: '#F24D4F',
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Actions */}
                  <Box display="flex" gap={1.5}>
                    {challenge.isParticipating ? (
                      <Button
                        size="small"
                        disabled
                        variant="outlined"
                        sx={{
                          borderRadius: '20px',
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Joined
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => joinMutation.mutate(challenge.id)}
                        disabled={joinMutation.isPending}
                        sx={{
                          borderRadius: '20px',
                          textTransform: 'none',
                          fontWeight: 600,
                          bgcolor: '#F24D4F',
                          '&:hover': { bgcolor: '#d93d3f' },
                        }}
                      >
                        Join Challenge
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => setSelectedChallenge(challenge)}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#F24D4F',
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Challenge Detail Dialog with Leaderboard */}
        <Dialog
          open={Boolean(selectedChallenge)}
          onClose={() => setSelectedChallenge(null)}
          maxWidth="sm"
          fullWidth
        >
          {selectedChallenge && (
            <>
              {selectedChallenge.coverImageUrl && (
                <Box
                  component="img"
                  src={selectedChallenge.coverImageUrl}
                  alt={selectedChallenge.title}
                  sx={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              <DialogTitle sx={{ fontWeight: 700 }}>
                {selectedChallenge.title}
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedChallenge.description}
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  gutterBottom
                >
                  Rules
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                >
                  {selectedChallenge.rules}
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap" mb={3}>
                  <Chip
                    icon={<TrophyIcon />}
                    label={`${selectedChallenge.xpReward} XP reward`}
                    sx={{
                      bgcolor: 'rgba(242,77,79,0.12)',
                      color: '#F24D4F',
                      fontWeight: 700,
                      '& .MuiChip-icon': { color: '#F24D4F' },
                    }}
                  />
                  <Chip
                    label={`${selectedChallenge.targetCount} reviews required`}
                    sx={{
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    icon={<TimerIcon />}
                    label={getDaysRemaining(selectedChallenge.endDate)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Leaderboard section */}
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  mb={1.5}
                >
                  Leaderboard
                </Typography>

                {leaderboard && leaderboard.length > 0 ? (
                  <List disablePadding>
                    {leaderboard.slice(0, 10).map((participant: ChallengeParticipant, index: number) => (
                      <ListItem
                        key={participant.id}
                        sx={{
                          px: 0,
                          py: 1,
                          borderBottom:
                            index < leaderboard.length - 1
                              ? '1px solid rgba(0,0,0,0.06)'
                              : 'none',
                        }}
                      >
                        <Typography
                          sx={{
                            width: 28,
                            fontWeight: 700,
                            fontSize: 14,
                            color:
                              index === 0
                                ? '#FFD700'
                                : index === 1
                                  ? '#C0C0C0'
                                  : index === 2
                                    ? '#CD7F32'
                                    : 'text.secondary',
                          }}
                        >
                          #{index + 1}
                        </Typography>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar
                            src={participant.userAvatar}
                            sx={{ width: 32, height: 32 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={participant.userName}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                          secondary={
                            participant.completed
                              ? 'Completed'
                              : `${participant.progress} reviews`
                          }
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                        <Typography
                          fontWeight={700}
                          fontSize={14}
                          sx={{ color: '#F24D4F' }}
                        >
                          {participant.progress}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    color="text.secondary"
                    fontSize={14}
                    textAlign="center"
                    py={2}
                  >
                    No participants yet. Be the first to join!
                  </Typography>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                  onClick={() => setSelectedChallenge(null)}
                  sx={{ textTransform: 'none' }}
                >
                  Close
                </Button>
                {!selectedChallenge.isParticipating && (
                  <Button
                    variant="contained"
                    onClick={() => joinMutation.mutate(selectedChallenge.id)}
                    disabled={joinMutation.isPending}
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#F24D4F',
                      '&:hover': { bgcolor: '#d93d3f' },
                    }}
                  >
                    Join Challenge
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </AppShell>
  );
}
