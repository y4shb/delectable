import { Box, Typography, Card, CardMedia, CardContent, Chip, Skeleton, useTheme } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useKitchenStories } from '../hooks/useApi';
import type { KitchenStory } from '../types';

const STORY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  chef_interview: { label: 'Chef Interview', color: '#e65100' },
  sourcing: { label: 'Sourcing', color: '#2e7d32' },
  recipe: { label: 'Recipe', color: '#c62828' },
  behind_scenes: { label: 'Behind the Scenes', color: '#1565c0' },
  history: { label: 'History', color: '#6a1b9a' },
};

interface KitchenStoriesSectionProps {
  venueId?: string;
}

export default function KitchenStoriesSection({ venueId }: KitchenStoriesSectionProps) {
  const theme = useTheme();
  const { data, isLoading } = useKitchenStories(
    venueId ? { venue: venueId } : undefined,
  );

  const stories: KitchenStory[] = (data as KitchenStory[] | undefined) ?? [];

  if (!isLoading && stories.length === 0) return null;

  return (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ px: 2, mb: 1.5 }}
      >
        Kitchen Stories
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          px: 2,
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {isLoading
          ? [0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                sx={{ minWidth: 260, height: 200, borderRadius: '16px', flexShrink: 0 }}
              />
            ))
          : stories.slice(0, 8).map((story) => {
              const typeInfo = STORY_TYPE_LABELS[story.storyType] ?? {
                label: story.storyType,
                color: theme.palette.text.secondary,
              };
              return (
                <Card
                  key={story.id}
                  sx={{
                    minWidth: 260,
                    maxWidth: 260,
                    flexShrink: 0,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 130,
                      backgroundImage: story.coverPhotoUrl
                        ? `url(${story.coverPhotoUrl})`
                        : `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                    }}
                  >
                    <Chip
                      label={typeInfo.label}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: typeInfo.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </CardMedia>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {story.title}
                    </Typography>
                    {story.chefName && (
                      <Typography variant="caption" color="text.secondary">
                        {story.chefName}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <VisibilityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        {story.viewCount}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
      </Box>
    </Box>
  );
}
