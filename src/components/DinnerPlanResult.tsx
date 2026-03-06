import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  LocationOn,
  Restaurant,
  Map,
  RateReview,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import type { DinnerPlanResult as DinnerPlanResultType, DinnerPlanMember } from '../types';

interface DinnerPlanResultProps {
  result: DinnerPlanResultType;
  members: DinnerPlanMember[];
}

// Simple confetti-like celebration particles
function CelebrationParticles() {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; color: string; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const colors = ['#FFD700', '#F24D4F', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: 6 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            bgcolor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            animation: `confetti-fall 3s ease-in ${p.delay}s both`,
          }}
        />
      ))}
    </Box>
  );
}

export default function DinnerPlanResult({
  result,
  members,
}: DinnerPlanResultProps) {
  const router = useRouter();
  const winner = result.winner;
  const allVoted = result.allVoted;

  if (!winner) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary">
          No votes yet. Results will appear once members start voting.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      {allVoted && <CelebrationParticles />}

      {/* Winner Section */}
      <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', zIndex: 5 }}>
        <EmojiEvents
          sx={{
            fontSize: 48,
            color: '#FFD700',
            mb: 1,
            filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.4))',
          }}
        />
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, mb: 0.5 }}
        >
          {allVoted ? 'The Group Has Decided!' : 'Current Leader'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {result.votedCount} of {result.totalMembers} members have voted
        </Typography>
      </Box>

      {/* Winner Card */}
      <Card
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          mb: 3,
          border: '3px solid #FFD700',
          boxShadow: '0 8px 32px rgba(255,215,0,0.2)',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height={220}
            image={winner.venue.photoUrl || '/images/placeholder-venue.jpg'}
            alt={winner.venue.name}
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
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: '#FFD700',
              color: '#000',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <EmojiEvents sx={{ fontSize: 18 }} />
            WINNER
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: 'white', fontWeight: 800 }}
            >
              {winner.venue.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {winner.venue.cuisineType && (
              <Chip
                icon={<Restaurant sx={{ fontSize: 16 }} />}
                label={winner.venue.cuisineType}
                size="small"
                variant="outlined"
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ color: '#FFD700', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700 }}>
                {winner.venue.rating}
              </Typography>
            </Box>
            {winner.venue.locationText && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {winner.venue.locationText}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Vote breakdown for winner */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUp sx={{ color: '#4CAF50', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, color: '#4CAF50' }}>
                {winner.totalYes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                yes
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbDown sx={{ color: '#F44336', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, color: '#F44336' }}>
                {winner.totalNo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                no
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<Map />}
              onClick={() =>
                router.push(`/venue/${winner.venue.id}`)
              }
              sx={{
                flex: 1,
                bgcolor: '#F24D4F',
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#d93d3f' },
              }}
            >
              View Venue
            </Button>
            <Button
              variant="outlined"
              startIcon={<RateReview />}
              onClick={() =>
                router.push(`/review/new?venue=${winner.venue.id}`)
              }
              sx={{
                flex: 1,
                borderRadius: '48px',
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#F24D4F',
                color: '#F24D4F',
                '&:hover': { borderColor: '#d93d3f', bgcolor: 'rgba(242,77,79,0.04)' },
              }}
            >
              Write Review
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Voting Progress */}
      {!allVoted && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Voting Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(result.votedCount / result.totalMembers) * 100}
            sx={{
              borderRadius: 4,
              height: 8,
              bgcolor: 'action.hover',
              mb: 1,
              '& .MuiLinearProgress-bar': {
                bgcolor: '#F24D4F',
                borderRadius: 4,
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {members.map((member) => (
              <Chip
                key={member.id}
                avatar={
                  <Avatar
                    src={member.user.avatarUrl}
                    sx={{ width: 24, height: 24 }}
                  >
                    {member.user.name?.[0]}
                  </Avatar>
                }
                label={member.user.name}
                size="small"
                color={member.hasVoted ? 'success' : 'default'}
                variant={member.hasVoted ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Full results breakdown */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        All Venues Ranked
      </Typography>
      {result.venueResults.map((vr, index) => (
        <Box
          key={vr.venueOptionId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor: index === 0 ? 'rgba(255,215,0,0.08)' : 'transparent',
            border: index === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid',
            borderColor: index === 0 ? 'rgba(255,215,0,0.3)' : 'divider',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 18,
              color: index === 0 ? '#FFD700' : 'text.secondary',
              minWidth: 28,
            }}
          >
            #{index + 1}
          </Typography>
          <Avatar
            src={vr.venue.photoUrl}
            variant="rounded"
            sx={{ width: 48, height: 48 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {vr.venue.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {vr.venue.cuisineType}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ThumbUp sx={{ fontSize: 16, color: '#4CAF50' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                {vr.totalYes}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ThumbDown sx={{ fontSize: 16, color: '#F44336' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#F44336' }}>
                {vr.totalNo}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}

      {/* Dinner date info */}
      {(result.suggestedDate || result.suggestedTime) && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Suggested Dinner
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {result.suggestedDate && new Date(result.suggestedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {result.suggestedTime && ` at ${result.suggestedTime}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
