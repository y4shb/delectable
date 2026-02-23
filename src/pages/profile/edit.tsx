import AppShell from '../../layouts/AppShell';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useState } from 'react';
import { mockUser } from '../../api/mockApi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const CUISINE_OPTIONS = [
  'Japanese',
  'Italian',
  'American',
  'European',
  'Indian',
  'Mexican',
  'Thai',
  'Korean',
  'French',
  'Mediterranean',
];

const profileSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  bio: yup.string().optional().max(160, 'Bio must be 160 characters or less'),
});

interface ProfileFormData {
  name: string;
  bio?: string;
}

export default function EditProfilePage() {
  useRequireAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema) as any,
    defaultValues: {
      name: mockUser.name,
      bio: mockUser.bio,
    },
  });

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const onSubmit = (data: ProfileFormData) => {
    console.log('Save Changes', { ...data, selectedCuisines });
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
          Edit Profile
        </Typography>

        <Stack spacing={3}>
          {/* Avatar section */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative', width: 80, height: 80 }}>
              <Avatar
                src={mockUser.avatarUrl}
                sx={{ width: 80, height: 80 }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Name field */}
          <TextField
            variant="outlined"
            label="Display Name"
            fullWidth
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Bio field */}
          <TextField
            variant="outlined"
            label="Bio"
            fullWidth
            multiline
            rows={3}
            {...register('bio')}
            error={!!errors.bio}
            helperText={errors.bio?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />

          {/* Cuisine Preferences */}
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
              Favorite Cuisines
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {CUISINE_OPTIONS.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <Chip
                    key={cuisine}
                    label={cuisine}
                    onClick={() => handleCuisineToggle(cuisine)}
                    sx={{
                      bgcolor: isSelected
                        ? theme.palette.primary.main
                        : isDark
                          ? 'rgba(35, 35, 35, 0.9)'
                          : 'rgba(251, 234, 236, 0.9)',
                      color: isSelected
                        ? '#fff'
                        : isDark
                          ? theme.palette.primary.main
                          : theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 2,
                      height: 28,
                      border: isSelected
                        ? 'none'
                        : isDark
                          ? `2px solid ${theme.palette.primary.main}`
                          : 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isSelected
                          ? theme.palette.primary.dark
                          : isDark
                            ? 'rgba(50, 50, 50, 0.9)'
                            : 'rgba(251, 234, 236, 1)',
                      },
                    }}
                    size="small"
                  />
                );
              })}
            </Box>
          </Box>

          {/* Save button */}
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
                backgroundColor: '#d93d3f',
              },
            }}
          >
            Save Changes
          </Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
