import { Box, Typography, Button, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useRouter } from 'next/router';

interface LockedFeaturePromptProps {
  featureName: string;
  currentLevel: number;
  requiredLevel: number;
  isAnonymous?: boolean;
}

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Write your first review',
  2: 'Follow 3+ tastemakers',
  3: 'Create a playlist',
  4: 'Get 10 followers or write 5 reviews',
  5: 'Become a power user',
};

/**
 * LockedFeaturePrompt shows when a user doesn't meet the required maturity level.
 *
 * Displays:
 * - Lock icon
 * - Feature name
 * - Current progress
 * - What to do next
 */
export default function LockedFeaturePrompt({
  featureName,
  currentLevel,
  requiredLevel,
  isAnonymous = false,
}: LockedFeaturePromptProps) {
  const theme = useTheme();
  const router = useRouter();

  const nextAction = LEVEL_DESCRIPTIONS[currentLevel + 1] || 'Keep exploring';
  const progress = Math.min((currentLevel / requiredLevel) * 100, 99);

  const handleAction = () => {
    if (isAnonymous) {
      router.push('/login');
    } else if (currentLevel === 0) {
      router.push('/review/new');
    } else if (currentLevel === 1) {
      router.push('/search');
    } else if (currentLevel === 2) {
      router.push('/playlist/new');
    } else {
      router.push('/feed');
    }
  };

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
        border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <LockOutlinedIcon
          sx={{ fontSize: 28, color: theme.palette.text.secondary }}
        />
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>
        {isAnonymous ? 'Sign up to unlock' : `Unlock ${featureName}`}
      </Typography>

      {!isAnonymous && (
        <>
          <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
            Level {currentLevel} / {requiredLevel}
          </Typography>

          {/* Progress bar */}
          <Box
            sx={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              mb: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: 3,
                bgcolor: theme.palette.primary.main,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>

          <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
            Next: {nextAction}
          </Typography>
        </>
      )}

      <Button
        variant="contained"
        onClick={handleAction}
        sx={{
          borderRadius: '48px',
          py: 1,
          px: 3,
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        {isAnonymous ? 'Sign Up' : 'Get Started'}
      </Button>
    </Box>
  );
}
