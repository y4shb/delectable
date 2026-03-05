import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  AcUnit as FreezeIcon,
} from '@mui/icons-material';
import type { DiningStreak } from '../types';

interface StreakDisplayProps {
  streak: DiningStreak;
  compact?: boolean;
}

export default function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  const isActive = streak.currentStreak > 0;

  if (compact) {
    return (
      <Tooltip title={`${streak.currentStreak}-day streak | Longest: ${streak.longestStreak} days`}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <FireIcon
            sx={{
              fontSize: 18,
              color: isActive ? 'error.main' : 'grey.400',
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            color={isActive ? 'error.main' : 'text.secondary'}
          >
            {streak.currentStreak}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: isActive ? 'error.50' : 'grey.100',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isActive ? 'error.200' : 'grey.300',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <FireIcon
            sx={{
              fontSize: 32,
              color: isActive ? 'error.main' : 'grey.400',
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700} color={isActive ? 'error.main' : 'text.secondary'}>
              {streak.currentStreak}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              day streak
            </Typography>
          </Box>
        </Box>

        <Box textAlign="right">
          <Typography variant="body2" color="text.secondary">
            Best: {streak.longestStreak} days
          </Typography>
        </Box>
      </Box>

      <Box display="flex" gap={1} mt={2}>
        {Array.from({ length: streak.maxFreezes }).map((_, i) => (
          <Chip
            key={i}
            icon={<FreezeIcon />}
            label="Freeze"
            size="small"
            variant={i < streak.streakFreezes ? 'filled' : 'outlined'}
            color={i < streak.streakFreezes ? 'info' : 'default'}
            sx={{ opacity: i < streak.streakFreezes ? 1 : 0.4 }}
          />
        ))}
      </Box>

      {streak.lastActivityDate && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Last activity: {new Date(streak.lastActivityDate).toLocaleDateString()}
        </Typography>
      )}
    </Box>
  );
}
