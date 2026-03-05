import { Box, Chip, Typography, useTheme } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteOccasion, unvoteOccasion } from '../api/api';
import type { VenueOccasion } from '../types';

interface OccasionSectionProps {
  venueId: string;
  occasions: VenueOccasion[];
}

export default function OccasionSection({ venueId, occasions }: OccasionSectionProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: ({ slug, voted }: { slug: string; voted: boolean }) =>
      voted ? unvoteOccasion(venueId, slug) : voteOccasion(venueId, slug),
    onMutate: async ({ slug, voted }) => {
      await queryClient.cancelQueries({ queryKey: ['venueDetail', venueId] });
      queryClient.setQueryData(['venueDetail', venueId], (old: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const venue = old as any;
        if (!venue?.occasions) return old;
        return {
          ...venue,
          occasions: venue.occasions.map((o: VenueOccasion) =>
            o.occasion.slug === slug
              ? {
                  ...o,
                  userVoted: !voted,
                  voteCount: voted ? o.voteCount - 1 : o.voteCount + 1,
                }
              : o
          ),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['venueDetail', venueId] });
    },
  });

  if (!occasions || occasions.length === 0) return null;

  return (
    <Box sx={{ mt: 2.5, px: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 1 }}>
        Perfect For
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {occasions.slice(0, 8).map((vo) => {
          const isVoted = vo.userVoted;
          return (
            <Chip
              key={vo.occasion.slug}
              label={`${vo.occasion.emoji} ${vo.occasion.label} (${vo.voteCount})`}
              onClick={() =>
                voteMutation.mutate({
                  slug: vo.occasion.slug,
                  voted: isVoted,
                })
              }
              sx={{
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                bgcolor: isVoted
                  ? theme.palette.primary.main
                  : theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                color: isVoted
                  ? '#fff'
                  : theme.palette.text.primary,
                '&:hover': {
                  bgcolor: isVoted
                    ? theme.palette.primary.dark
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.14)'
                      : 'rgba(0,0,0,0.1)',
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
