import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

interface TrendIndicatorProps {
  trend: 'improving' | 'declining' | 'stable';
  trendScore?: number;
  size?: 'small' | 'medium';
}

export default function TrendIndicator({
  trend,
  trendScore,
  size = 'medium',
}: TrendIndicatorProps) {
  const theme = useTheme();

  const iconSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 12 : 14;

  const config = {
    improving: {
      icon: <TrendingUpIcon sx={{ fontSize: iconSize }} />,
      label: 'Improving',
      color: theme.palette.success.main,
    },
    declining: {
      icon: <TrendingDownIcon sx={{ fontSize: iconSize }} />,
      label: 'Declining',
      color: theme.palette.error.main,
    },
    stable: {
      icon: <RemoveIcon sx={{ fontSize: iconSize }} />,
      label: 'Stable',
      color: theme.palette.text.secondary,
    },
  };

  const { icon, label, color } = config[trend];

  const tooltipText =
    trendScore != null
      ? `${label} (score: ${trendScore.toFixed(2)})`
      : label;

  return (
    <Tooltip title={tooltipText} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color,
          px: size === 'small' ? 1 : 1.5,
          py: size === 'small' ? 0.25 : 0.5,
          borderRadius: '16px',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.04)',
        }}
      >
        {icon}
        <Typography
          sx={{
            fontSize,
            fontWeight: 600,
            color: 'inherit',
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
