import AppShell from '../../layouts/AppShell';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createPlaylist } from '../../api/api';
import { useRouter } from 'next/router';

const playlistSchema = yup.object({
  title: yup.string().required('Playlist title is required').min(2, 'Title must be at least 2 characters'),
  description: yup.string().optional(),
});

interface PlaylistFormData {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export default function NewPlaylistPage() {
  useRequireAuth();
  const theme = useTheme();
  const router = useRouter();

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
    try {
      const playlist = await createPlaylist({
        title: data.title,
        description: data.description,
        isPublic: data.isPublic ?? true,
      });
      router.push(`/playlist/${playlist.id}`);
    } catch {
      // Handle error silently for now
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
            Create Playlist
          </Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
