import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import api from '../api/client';

interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  targetCount: number;
  cuisineFilter: string;
  xpReward: number;
  participantCount: number;
  isParticipating: boolean;
  userProgress: {
    progress: number;
    completed: boolean;
    target: number;
  } | null;
}

async function fetchChallenges(): Promise<Challenge[]> {
  const { data } = await api.get('/challenges/');
  return data.data ?? data.results ?? data;
}

async function joinChallenge(id: string): Promise<void> {
  await api.post(`/challenges/${id}/join/`);
}

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const { data: challenges, isLoading, error } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });

  const joinMutation = useMutation({
    mutationFn: joinChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setSelectedChallenge(null);
    },
  });

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={200}
              sx={{ mb: 2, borderRadius: 2 }}
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
          <TrophyIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Food Challenges
          </Typography>
        </Box>

        {challenges?.length === 0 && (
          <Alert severity="info">No active challenges right now. Check back soon!</Alert>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          {challenges?.map((challenge) => (
            <Card key={challenge.id} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
              {challenge.coverImageUrl && (
                <CardMedia
                  component="img"
                  sx={{ width: { xs: '100%', sm: 200 }, height: { xs: 150, sm: 'auto' } }}
                  image={challenge.coverImageUrl}
                  alt={challenge.title}
                />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" fontWeight={700}>
                      {challenge.title}
                    </Typography>
                    <Chip
                      icon={<TrophyIcon />}
                      label={`${challenge.xpReward} XP`}
                      size="small"
                      color="warning"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {challenge.description}
                  </Typography>

                  <Box display="flex" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TimerIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {getDaysRemaining(challenge.endDate)} days left
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {challenge.participantCount} participants
                      </Typography>
                    </Box>
                    {challenge.cuisineFilter && (
                      <Chip label={challenge.cuisineFilter} size="small" variant="outlined" />
                    )}
                  </Box>

                  {challenge.userProgress && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">
                          {challenge.userProgress.progress} / {challenge.userProgress.target} reviews
                        </Typography>
                        {challenge.userProgress.completed && (
                          <Chip label="Completed!" size="small" color="success" />
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(challenge.userProgress.progress / challenge.userProgress.target) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  {challenge.isParticipating ? (
                    <Button size="small" disabled>
                      Joined
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      Join Challenge
                    </Button>
                  )}
                  <Button size="small" onClick={() => setSelectedChallenge(challenge)}>
                    View Details
                  </Button>
                </CardActions>
              </Box>
            </Card>
          ))}
        </Box>

        {/* Challenge Detail Dialog */}
        <Dialog
          open={Boolean(selectedChallenge)}
          onClose={() => setSelectedChallenge(null)}
          maxWidth="sm"
          fullWidth
        >
          {selectedChallenge && (
            <>
              <DialogTitle>{selectedChallenge.title}</DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedChallenge.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Rules
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedChallenge.rules}
                </Typography>
                <Box display="flex" gap={2}>
                  <Chip
                    icon={<TrophyIcon />}
                    label={`${selectedChallenge.xpReward} XP reward`}
                    color="warning"
                  />
                  <Chip
                    label={`${selectedChallenge.targetCount} reviews required`}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedChallenge(null)}>Close</Button>
                {!selectedChallenge.isParticipating && (
                  <Button
                    variant="contained"
                    onClick={() => joinMutation.mutate(selectedChallenge.id)}
                    disabled={joinMutation.isPending}
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
