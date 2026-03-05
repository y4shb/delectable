import { useState } from 'react';
import AppShell from '../../layouts/AppShell';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createPlaylist } from '../../api/api';
import { useRouter } from 'next/router';
import type { PlaylistVisibility } from '../../types';

const playlistSchema = yup.object({
  title: yup.string().required('Playlist title is required').min(2, 'Title must be at least 2 characters'),
  description: yup.string().optional(),
});

interface PlaylistFormData {
  title: string;
  description?: string;
}

export default function NewPlaylistPage() {
  useRequireAuth();
  const theme = useTheme();
  const router = useRouter();
  const [visibility, setVisibility] = useState<PlaylistVisibility>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PlaylistFormData>({
    resolver: yupResolver(playlistSchema) as any,
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: PlaylistFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const playlist = await createPlaylist({
        title: data.title,
        description: data.description,
        visibility,
      });
      router.push(`/playlist/${playlist.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleVisibilityChange = (
    _: React.MouseEvent<HTMLElement>,
    newVisibility: PlaylistVisibility | null,
  ) => {
    if (newVisibility !== null) {
      setVisibility(newVisibility);
    }
  };

  return (
    <AppShell>
      <Box sx={{ maxWidth: 420, mx: 'auto', pb: 11 }}>
        <Typography
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            fontSize: 28,
            color: theme.palette.primary.main,
            textAlign: 'left',
            mb: 3,
          }}
        >
          New Playlist
        </Typography>

        <Stack spacing={3}>
          {/* Title input */}
          <TextField
            variant="outlined"
            label="Playlist Title"
            fullWidth
            {...register('title')}
            error={!!errors.title}
            helperText={errors.title?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Description input */}
          <TextField
            variant="outlined"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Visibility selector */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Who can see this playlist?
            </Typography>
            <ToggleButtonGroup
              value={visibility}
              exclusive
              onChange={handleVisibilityChange}
              aria-label="playlist visibility"
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  flex: 1,
                  textTransform: 'none',
                  borderRadius: '12px',
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="public" aria-label="public">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PublicIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Public</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="followers" aria-label="followers only">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Followers</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="private" aria-label="private">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LockIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Private</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }}>
              {visibility === 'public' && 'Anyone can view this playlist'}
              {visibility === 'followers' && 'Only your followers can view this playlist'}
              {visibility === 'private' && 'Only you can view this playlist'}
            </Typography>
          </Box>

          {/* Cover photo area */}
          <Box
            sx={{
              height: 200,
              width: '100%',
              borderRadius: '20px',
              border: '2px dashed',
              borderColor: 'text.secondary',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <PhotoCameraIcon sx={{ color: 'text.secondary', fontSize: 40, mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tap to add cover photo
            </Typography>
          </Box>

          {/* Add spots section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Add Spots
              </Typography>
              <Button
                variant="contained"
                aria-label="Add a spot to playlist"
                sx={{
                  minWidth: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  padding: 0,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                +
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Search and add restaurants to your playlist
            </Typography>
          </Box>

          {/* Create button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '48px',
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Playlist'}
          </Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
