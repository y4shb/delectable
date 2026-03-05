import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Slider,
  IconButton,
  CircularProgress,
  useTheme,
  Fade,
  Zoom,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../context/AuthContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useVenues } from '../../hooks/useApi';
import { createQuickReview } from '../../api/api';
import type { Venue } from '../../types';

export default function QuickReviewPage() {
  useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0); // 0: photo, 1: venue, 2: rating
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [rating, setRating] = useState(7.5);
  const [dishName, setDishName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');

  const { data: venues, isLoading: venuesLoading } = useVenues();

  // Filter venues based on search
  const filteredVenues = (venues ?? []).filter((v) =>
    v.name.toLowerCase().includes(venueSearch.toLowerCase()),
  );

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        // In a real app, you'd upload to a CDN and get a URL
        // For now, we'll use a placeholder
        setPhotoUrl('/images/food3.jpg');
        setStep(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVenue || !photoUrl) return;

    setSubmitting(true);
    try {
      const result = await createQuickReview({
        venue: selectedVenue.id,
        rating,
        photoUrl,
        dishName: dishName || undefined,
      });

      if (result.isFirstReview) {
        setShowCelebration(true);
        setTimeout(() => {
          router.push('/feed');
        }, 3000);
      } else {
        router.push('/feed');
      }
    } catch (err) {
      console.error('Failed to create review:', err);
      setSubmitting(false);
    }
  };

  // Celebration animation
  if (showCelebration) {
    return (
      <AppShell hideTabBar>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 4,
          }}
        >
          <Zoom in timeout={500}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                animation: 'pulse 1s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                },
              }}
            >
              <CelebrationIcon sx={{ fontSize: 60, color: '#fff' }} />
            </Box>
          </Zoom>

          <Fade in timeout={800}>
            <Typography
              sx={{
                fontFamily: '"Classy Pen", Helvetica, sans-serif',
                fontSize: 36,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              Congratulations!
            </Typography>
          </Fade>

          <Fade in timeout={1000}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
              Your first review is live!
            </Typography>
          </Fade>

          <Fade in timeout={1200}>
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              You&apos;re now a de. reviewer
            </Typography>
          </Fade>

          {/* Confetti particles */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: -1,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    '#FFD700',
                    '#FF6B6B',
                  ][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  animation: `fall${i % 3} ${2 + Math.random() * 2}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  '@keyframes fall0': {
                    '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                    '100%': {
                      transform: 'translateY(100vh) rotate(720deg)',
                      opacity: 0,
                    },
                  },
                  '@keyframes fall1': {
                    '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                    '100%': {
                      transform: 'translateY(100vh) rotate(-540deg)',
                      opacity: 0,
                    },
                  },
                  '@keyframes fall2': {
                    '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                    '100%': {
                      transform: 'translateY(100vh) rotate(360deg)',
                      opacity: 0,
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell hideTabBar>
      <Box sx={{ pb: 10 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pt: 2,
            px: 2,
            mb: 2,
          }}
        >
          <IconButton onClick={() => router.back()} aria-label="Go back">
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: 20, flex: 1 }}>
            Share a Bite
          </Typography>
        </Box>

        {/* Progress indicator */}
        <Box sx={{ display: 'flex', gap: 1, px: 3, mb: 3 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor:
                  i <= step
                    ? theme.palette.primary.main
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.08)',
                transition: 'bgcolor 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Step 0: Photo */}
        {step === 0 && (
          <Fade in>
            <Box sx={{ px: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 22, mb: 0.5 }}>
                Take a photo
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Show us what you&apos;re eating
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />

              <Box
                onClick={handlePhotoClick}
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '24px',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.02)',
                  border: `2px dashed ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <CameraAltIcon
                  sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
                />
                <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                  Tap to add photo
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  or drag and drop
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 1: Venue */}
        {step === 1 && (
          <Fade in>
            <Box sx={{ px: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 22, mb: 0.5 }}>
                Where are you?
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Tag the restaurant
              </Typography>

              {/* Photo preview */}
              {photoPreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: '16px',
                    backgroundImage: `url(${photoPreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    mb: 3,
                  }}
                />
              )}

              <Autocomplete
                options={filteredVenues}
                getOptionLabel={(option) => option.name}
                value={selectedVenue}
                onChange={(_, value) => {
                  setSelectedVenue(value);
                  if (value) setStep(2);
                }}
                inputValue={venueSearch}
                onInputChange={(_, value) => setVenueSearch(value)}
                loading={venuesLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search restaurants..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...otherProps}
                      sx={{ py: 1.5 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                          {option.cuisineType} - {option.locationText}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />

              <Button
                variant="outlined"
                onClick={() => setStep(0)}
                sx={{
                  mt: 3,
                  borderRadius: '48px',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Back
              </Button>
            </Box>
          </Fade>
        )}

        {/* Step 2: Rating */}
        {step === 2 && (
          <Fade in>
            <Box sx={{ px: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 22, mb: 0.5 }}>
                How was it?
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Rate your experience
              </Typography>

              {/* Photo + venue preview */}
              {photoPreview && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '12px',
                      backgroundImage: `url(${photoPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                      {selectedVenue?.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                      {selectedVenue?.cuisineType}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Rating display */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: 64,
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                  }}
                >
                  {rating.toFixed(1)}
                </Typography>
                <Slider
                  value={rating}
                  onChange={(_, v) => setRating(v as number)}
                  min={0}
                  max={10}
                  step={0.5}
                  sx={{
                    mx: 2,
                    '& .MuiSlider-thumb': {
                      width: 28,
                      height: 28,
                    },
                  }}
                />
              </Box>

              {/* Optional dish name */}
              <TextField
                fullWidth
                placeholder="What did you have? (optional)"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                  },
                }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(1)}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    borderRadius: '48px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 16,
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={handleSubmit}
                  sx={{
                    flex: 2,
                    py: 1.5,
                    borderRadius: '48px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 16,
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Post Review'
                  )}
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Box>
    </AppShell>
  );
}
