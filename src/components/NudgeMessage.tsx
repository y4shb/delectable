import { Box, Typography, Button, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useTasteProfile } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

interface NudgeConfig {
  message: string;
  action: string;
  href: string;
  emoji: string;
}

const NUDGES: Record<number, NudgeConfig> = {
  0: {
    message: 'Share your first food discovery',
    action: 'Write a Review',
    href: '/review/quick',
    emoji: '\uD83D\uDCF8',
  },
  1: {
    message: 'Follow tastemakers to see their recommendations',
    action: 'Find People',
    href: '/search',
    emoji: '\uD83D\uDC65',
  },
  2: {
    message: 'Save your favorites to a playlist',
    action: 'Create Playlist',
    href: '/playlist/new',
    emoji: '\uD83D\uDCCB',
  },
  3: {
    message: 'Keep exploring and sharing',
    action: 'Explore',
    href: '/feed?tab=explore',
    emoji: '\uD83C\uDF1F',
  },
};

interface NudgeMessageProps {
  /** Show compact version (single line) */
  compact?: boolean;
  /** Override which nudge to show */
  forLevel?: number;
}

/**
 * NudgeMessage shows contextual guidance based on user's maturity level.
 *
 * Encourages users to take the next action to level up.
 */
export default function NudgeMessage({
  compact = false,
  forLevel,
}: NudgeMessageProps) {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: tasteProfile } = useTasteProfile();

  // Don't show for anonymous users
  if (!isAuthenticated) return null;

  const currentLevel = forLevel ?? tasteProfile?.maturityLevel ?? 0;
  const nudge = NUDGES[currentLevel] || NUDGES[3];

  if (compact) {
    return (
      <Box
        onClick={() => router.push(nudge.href)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          borderRadius: '16px',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.02)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
          },
        }}
      >
        <Typography sx={{ fontSize: 20 }}>{nudge.emoji}</Typography>
        <Typography sx={{ flex: 1, fontWeight: 500, fontSize: 14 }}>
          {nudge.message}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {nudge.action}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 4,
        px: 3,
        borderRadius: '20px',
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
      }}
    >
      <Typography sx={{ fontSize: 40, mb: 1 }}>{nudge.emoji}</Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 16, mb: 0.5 }}>
        {nudge.message}
      </Typography>
      <Button
        variant="contained"
        onClick={() => router.push(nudge.href)}
        sx={{
          mt: 2,
          borderRadius: '48px',
          py: 1,
          px: 3,
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        {nudge.action}
      </Button>
    </Box>
  );
}
