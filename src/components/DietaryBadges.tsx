import { Box, Chip, useTheme } from '@mui/material';
import type { DietaryBadge } from '../types';

const DIETARY_EMOJI: Record<string, string> = {
  vegan: '\uD83C\uDF31',
  vegetarian: '\uD83E\uDD66',
  'gluten-free': '\uD83C\uDF3E',
  halal: '\u2728',
  kosher: '\u2721\uFE0F',
  'dairy-free': '\uD83E\uDD5B',
  'nut-free': '\uD83E\uDD5C',
};

interface DietaryBadgesProps {
  badges: DietaryBadge[];
}

export default function DietaryBadges({ badges }: DietaryBadgesProps) {
  const theme = useTheme();

  if (!badges || badges.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
      {badges.map((badge) => {
        const emoji = DIETARY_EMOJI[badge.category] || '';
        const label = badge.category
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        return (
          <Chip
            key={badge.category}
            label={`${emoji} ${label}`}
            size="small"
            sx={{
              borderRadius: '12px',
              fontWeight: 500,
              fontSize: 12,
              bgcolor: badge.isAvailable
                ? theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(76, 175, 80, 0.12)'
                : theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.06)',
              color: badge.isAvailable
                ? theme.palette.mode === 'dark'
                  ? '#81C784'
                  : '#2E7D32'
                : theme.palette.text.secondary,
            }}
          />
        );
      })}
    </Box>
  );
}
