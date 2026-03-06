import React from 'react';
import { Box, Typography } from '@mui/material';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

interface RecapCardProps {
  index: number;
  title: string;
  icon: React.ReactNode;
  mainStat: string | number;
  statLabel: string;
  subtitle?: string;
  isActive: boolean;
}

export default function RecapCard({
  index,
  title,
  icon,
  mainStat,
  statLabel,
  subtitle,
  isActive,
}: RecapCardProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        aspectRatio: '9/16',
        background: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        p: 4,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        transform: isActive ? 'scale(1)' : 'scale(0.9)',
        opacity: isActive ? 1 : 0.5,
        transition: 'transform 0.4s ease, opacity 0.4s ease',
        position: isActive ? 'relative' : 'absolute',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>{icon}</Box>

      <Typography
        variant="subtitle1"
        sx={{
          color: 'rgba(255,255,255,0.8)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 2,
          mb: 2,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="h1"
        sx={{
          color: '#fff',
          fontWeight: 800,
          fontSize: { xs: '4rem', sm: '5rem' },
          lineHeight: 1,
          mb: 1,
          textShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {mainStat}
      </Typography>

      <Typography
        variant="h5"
        sx={{
          color: 'rgba(255,255,255,0.95)',
          fontWeight: 600,
          mb: 2,
        }}
      >
        {statLabel}
      </Typography>

      {subtitle && (
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            mt: 1,
          }}
        >
          {subtitle}
        </Typography>
      )}

      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.4)',
          position: 'absolute',
          bottom: 24,
          letterSpacing: 1,
        }}
      >
        de. monthly recap
      </Typography>
    </Box>
  );
}
