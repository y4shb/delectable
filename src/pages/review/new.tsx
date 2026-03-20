import { useState } from 'react';
import AppShell from '../../layouts/AppShell';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Slider,
  Chip,
  Autocomplete,
  useTheme,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useVenues } from '../../hooks/useApi';
import { createReview } from '../../api/api';
import { Venue } from '../../types';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import ImageUpload from '../../components/ImageUpload';

const TAGS = [
  'Coffee',
  'Desserts',
  'Pasta',
  'Sushi',
  'Japanese',
  'Italian',
  'American',
  'Group Dinner',
  'Solo-date',
  'Experimental',
  'Burgers',
  'Diner',
];

const reviewSchema = yup.object({
  venue: yup.object().nullable().required('Please select a venue'),
  rating: yup.number().min(0).max(10).required('Rating is required'),
  dishName: yup.string().optional().max(200),
  reviewText: yup.string().required('Please write a review').min(10, 'Review must be at least 10 characters'),
  selectedTags: yup.array().of(yup.string().defined()).min(1, 'Select at least one tag'),
});

interface ReviewFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venue: any;
  rating: number;
  dishName: string;
  reviewText: string;
  selectedTags: string[];
}

export default function NewReviewPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const theme = useTheme();
  const router = useRouter();

  const { data: venues, isLoading: venuesLoading } = useVenues();
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ReviewFormData>({
    resolver: yupResolver(reviewSchema) as any,
    defaultValues: {
      venue: null,
      rating: 7.0,
      dishName: '',
      reviewText: '',
      selectedTags: [],
    },
  });

  const selectedTags = watch('selectedTags') || [];
  const rating = watch('rating') ?? 7.0;

  const handleTagToggle = (tag: string) => {
    const current = selectedTags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setValue('selectedTags', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: ReviewFormData) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const selectedVenue = data.venue as Venue;

      await createReview({
        venue: selectedVenue.id,
        rating: data.rating,
        text: data.reviewText,
        tags: data.selectedTags,
        photoUrl: photoUrl || undefined,
        dishName: data.dishName || undefined,
      });
      router.push('/feed');
    } catch {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || venuesLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box sx={{ maxWidth: 420, mx: 'auto', pb: 11 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            fontSize: 28,
            color: theme.palette.primary.main,
            textAlign: 'left',
            mb: 3,
          }}
        >
          New Review
        </Typography>

        <Stack spacing={3}>
          {/* Venue selection */}
          <Controller
            name="venue"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={venues ?? []}
                getOptionLabel={(option) => option.name}
                value={field.value as Venue | null}
                onChange={(_e, newValue) => field.onChange(newValue)}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {option.cuisineType} &middot; {option.locationText}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Select Venue"
                    fullWidth
                    error={!!errors.venue}
                    helperText={errors.venue?.message as string}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '20px',
                      },
                    }}
                  />
                )}
              />
            )}
          />

          {/* Dish name (optional) */}
          <Controller
            name="dishName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Dish Name (optional)"
                placeholder="e.g. Toro Nigiri"
                fullWidth
                error={!!errors.dishName}
                helperText={errors.dishName?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                  },
                }}
              />
            )}
          />

          {/* Rating selector */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Rating
              </Typography>
              <Typography
                sx={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                {rating.toFixed(1)}
              </Typography>
            </Box>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <Slider
                  value={field.value}
                  onChange={(_e, newValue) => field.onChange(newValue as number)}
                  min={0}
                  max={10}
                  step={0.1}
                  aria-label="Rating from 0 to 10"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => v.toFixed(1)}
                  sx={{
                    color: theme.palette.primary.main,
                    '& .MuiSlider-thumb': {
                      width: 24,
                      height: 24,
                      backgroundColor: '#fff',
                      border: `2px solid ${theme.palette.primary.main}`,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0 0 0 8px ${theme.palette.primary.main}29`,
                      },
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: theme.palette.primary.main,
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.15)',
                    },
                  }}
                />
              )}
            />
            {errors.rating && (
              <FormHelperText error>{errors.rating.message}</FormHelperText>
            )}
          </Box>

          {/* Photo upload */}
          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="reviews"
            aspectRatio={16 / 9}
          />

          {/* Review text */}
          <Controller
            name="reviewText"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Write your review..."
                fullWidth
                multiline
                rows={4}
                error={!!errors.reviewText}
                helperText={errors.reviewText?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                  },
                }}
              />
            )}
          />

          {/* Tags */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1.5 }}
            >
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => handleTagToggle(tag)}
                    sx={{
                      bgcolor: isSelected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(35, 35, 35, 0.9)'
                          : 'rgba(251, 234, 236, 0.9)',
                      color: isSelected
                        ? '#fff'
                        : theme.palette.mode === 'dark'
                          ? theme.palette.primary.main
                          : theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 2,
                      height: 28,
                      border: isSelected
                        ? 'none'
                        : theme.palette.mode === 'dark'
                          ? `2px solid ${theme.palette.primary.main}`
                          : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isSelected
                          ? theme.palette.primary.dark
                          : theme.palette.mode === 'dark'
                            ? 'rgba(55, 55, 55, 0.9)'
                            : 'rgba(251, 224, 226, 1)',
                      },
                    }}
                    size="small"
                  />
                );
              })}
            </Box>
            {errors.selectedTags && (
              <FormHelperText error sx={{ mt: 1 }}>{errors.selectedTags.message}</FormHelperText>
            )}
          </Box>

          {/* Error message */}
          {submitError && (
            <Typography color="error" sx={{ fontSize: 14, textAlign: 'center' }}>
              {submitError}
            </Typography>
          )}

          {/* Submit button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
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
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Post Review'}
          </Button>
        </Stack>
      </Box>
    </AppShell>
  );
}
