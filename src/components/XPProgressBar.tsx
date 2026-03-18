import { Box, LinearProgress, Typography, Tooltip } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import type { UserXP } from '../types';
import { useState, useEffect } from 'react';

interface XPProgressBarProps {
  xp: UserXP;
  compact?: boolean;
}

export default function XPProgressBar({ xp, compact = false }: XPProgressBarProps) {
  const progressPercent = Math.min(xp.levelProgress * 100, 100);

  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  if (compact) {
    return (
      <Tooltip title={`${xp.totalXp} XP - ${xp.xpToNextLevel} XP to Level ${xp.level + 1}`}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          <Typography variant="caption" fontWeight={600}>
            Lv.{xp.level}
          </Typography>
          <Box sx={{ width: 40, ml: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={displayProgress}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  transition: 'transform 0.8s cubic-bezier(0, 0, 0.2, 1)',
                  backgroundColor: 'warning.main',
                },
              }}
            />
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <StarIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={700}>
            Level {xp.level}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {xp.totalXp.toLocaleString()} XP
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={displayProgress}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.8s cubic-bezier(0, 0, 0.2, 1)',
            backgroundColor: 'warning.main',
            borderRadius: 5,
          },
        }}
      />

      <Box display="flex" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="text.secondary">
          {xp.xpInLevel} XP
        </Typography>
        {xp.level < 20 ? (
          <Typography variant="caption" color="text.secondary">
            {xp.xpToNextLevel} XP to Level {xp.level + 1}
          </Typography>
        ) : (
          <Typography variant="caption" color="success.main" fontWeight={600}>
            MAX LEVEL
          </Typography>
        )}
      </Box>
    </Box>
  );
}
