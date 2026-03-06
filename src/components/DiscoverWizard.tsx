import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  useTheme,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StarIcon from '@mui/icons-material/Star';
import { useOccasions, useDiscoverVenues } from '../hooks/useApi';
import type { DiscoverRequest, DiscoverResult, OccasionTag } from '../types';
import DiscoverResultCard from './DiscoverResultCard';

// Default occasions if API hasn't loaded them yet
const DEFAULT_OCCASIONS: OccasionTag[] = [
  { slug: 'date-night', label: 'Date Night', emoji: '\u2764\uFE0F', category: 'social' },
  { slug: 'quick-lunch', label: 'Quick Lunch', emoji: '\u2615', category: 'time' },
  { slug: 'group-dinner', label: 'Group Dinner', emoji: '\uD83D\uDC6B', category: 'social' },
  { slug: 'solo-comfort', label: 'Solo Comfort', emoji: '\uD83E\uDDD1', category: 'vibe' },
  { slug: 'celebration', label: 'Celebration', emoji: '\uD83C\uDF89', category: 'social' },
  { slug: 'adventurous', label: 'Adventurous', emoji: '\uD83E\uDDED', category: 'vibe' },
];

const DISTANCE_OPTIONS = [
  { key: 'walking' as const, label: 'Walking distance', icon: DirectionsWalkIcon },
  { key: 'short_drive' as const, label: 'Short drive', icon: DirectionsCarIcon },
  { key: 'worth_the_trip' as const, label: 'Worth the trip', icon: StarIcon },
];

const DIETARY_OPTIONS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'gluten-free', label: 'Gluten-Free' },
  { key: 'halal', label: 'Halal' },
  { key: 'kosher', label: 'Kosher' },
];

type WizardStep = 'occasion' | 'distance' | 'dietary' | 'results';

const STEP_ORDER: WizardStep[] = ['occasion', 'distance', 'dietary', 'results'];

interface DiscoverWizardProps {
  onClose?: () => void;
}

export default function DiscoverWizard({ onClose }: DiscoverWizardProps) {
  const theme = useTheme();
  const { data: apiOccasions } = useOccasions();
  const discoverMutation = useDiscoverVenues();

  const [currentStep, setCurrentStep] = useState<WizardStep>('occasion');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<'walking' | 'short_drive' | 'worth_the_trip' | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [results, setResults] = useState<DiscoverResult[]>([]);

  const occasions = apiOccasions && apiOccasions.length > 0 ? apiOccasions : DEFAULT_OCCASIONS;

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;

  const goForward = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setDirection('forward');
      const nextStep = STEP_ORDER[nextIndex];

      if (nextStep === 'results') {
        // Submit the request
        const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve(null);
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null),
              { timeout: 5000, maximumAge: 300000 },
            );
          });
        };

        setCurrentStep('results');

        getUserLocation().then((location) => {
          const params: DiscoverRequest = {
            occasion: selectedOccasion!,
            distance: selectedDistance ?? undefined,
            dietary: selectedDietary.length > 0 ? selectedDietary : undefined,
            lat: location?.lat,
            lng: location?.lng,
          };

          discoverMutation.mutate(params, {
            onSuccess: (data) => {
              setResults(data.picks);
            },
          });
        });
      } else {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStepIndex, selectedOccasion, selectedDistance, selectedDietary, discoverMutation]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection('backward');
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    } else if (onClose) {
      onClose();
    }
  }, [currentStepIndex, onClose]);

  const toggleDietary = useCallback((key: string) => {
    setSelectedDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }, []);

  const slideAnimation = direction === 'forward'
    ? 'slideInFromRight 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
    : 'slideInFromLeft 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden',
        '@keyframes slideInFromRight': {
          '0%': { opacity: 0, transform: 'translateX(60px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        '@keyframes slideInFromLeft': {
          '0%': { opacity: 0, transform: 'translateX(-60px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        '@keyframes chipSelect': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      }}
    >
      {/* Header with back button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          pt: 2,
          pb: 1,
        }}
      >
        <IconButton
          onClick={goBack}
          aria-label="Go back"
          sx={{ color: theme.palette.text.primary }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        {currentStep !== 'results' && (
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            Step {currentStepIndex + 1} of {totalSteps - 1}
          </Typography>
        )}
      </Box>

      {/* Step content */}
      <Box
        key={currentStep}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          px: 3,
          pt: 2,
          pb: 12,
          animation: slideAnimation,
        }}
      >
        {/* Step 1: Occasion */}
        {currentStep === 'occasion' && (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, mb: 0.5, fontSize: 26 }}
            >
              What&apos;s the occasion?
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                mb: 3,
                fontSize: 15,
              }}
            >
              Pick one that fits your mood
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5,
              }}
              role="radiogroup"
              aria-label="Select occasion"
            >
              {occasions.map((occ) => {
                const isSelected = selectedOccasion === occ.slug;
                return (
                  <Box
                    key={occ.slug}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setSelectedOccasion(occ.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedOccasion(occ.slug);
                      }
                    }}
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      animation: isSelected ? 'chipSelect 0.3s ease' : 'none',
                      bgcolor: isSelected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.03)',
                      color: isSelected ? '#fff' : theme.palette.text.primary,
                      border: isSelected
                        ? `2px solid ${theme.palette.primary.main}`
                        : theme.palette.mode === 'dark'
                          ? '2px solid rgba(255,255,255,0.08)'
                          : '2px solid rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(12px)',
                      '&:hover': {
                        bgcolor: isSelected
                          ? theme.palette.primary.dark
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.06)',
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 32, mb: 0.5, lineHeight: 1 }}>
                      {occ.emoji}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: 1.2,
                      }}
                    >
                      {occ.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button
              fullWidth
              variant="contained"
              disabled={!selectedOccasion}
              onClick={goForward}
              aria-label="Continue to distance selection"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: 16,
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                '&:disabled': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              Continue
            </Button>
          </>
        )}

        {/* Step 2: Distance */}
        {currentStep === 'distance' && (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, mb: 0.5, fontSize: 26 }}
            >
              How far will you go?
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                mb: 3,
                fontSize: 15,
              }}
            >
              We&apos;ll find places within reach
            </Typography>

            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
              role="radiogroup"
              aria-label="Select distance"
            >
              {DISTANCE_OPTIONS.map(({ key, label, icon: Icon }) => {
                const isSelected = selectedDistance === key;
                return (
                  <Box
                    key={key}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setSelectedDistance(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDistance(key);
                      }
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      animation: isSelected ? 'chipSelect 0.3s ease' : 'none',
                      bgcolor: isSelected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.03)',
                      color: isSelected ? '#fff' : theme.palette.text.primary,
                      border: isSelected
                        ? `2px solid ${theme.palette.primary.main}`
                        : theme.palette.mode === 'dark'
                          ? '2px solid rgba(255,255,255,0.08)'
                          : '2px solid rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(12px)',
                      '&:hover': {
                        bgcolor: isSelected
                          ? theme.palette.primary.dark
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.06)',
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                      {label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button
              fullWidth
              variant="contained"
              disabled={!selectedDistance}
              onClick={goForward}
              aria-label="Continue to dietary preferences"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: 16,
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                '&:disabled': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              Continue
            </Button>
          </>
        )}

        {/* Step 3: Dietary */}
        {currentStep === 'dietary' && (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, mb: 0.5, fontSize: 26 }}
            >
              Any dietary needs?
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                mb: 3,
                fontSize: 15,
              }}
            >
              Optional - select all that apply
            </Typography>

            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}
              role="group"
              aria-label="Select dietary restrictions"
            >
              {DIETARY_OPTIONS.map(({ key, label }) => {
                const isSelected = selectedDietary.includes(key);
                return (
                  <Chip
                    key={key}
                    label={label}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleDietary(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDietary(key);
                      }
                    }}
                    sx={{
                      py: 2.5,
                      px: 1,
                      borderRadius: '14px',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      animation: isSelected ? 'chipSelect 0.3s ease' : 'none',
                      bgcolor: isSelected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.03)',
                      color: isSelected ? '#fff' : theme.palette.text.primary,
                      border: isSelected
                        ? `2px solid ${theme.palette.primary.main}`
                        : theme.palette.mode === 'dark'
                          ? '2px solid rgba(255,255,255,0.08)'
                          : '2px solid rgba(0,0,0,0.06)',
                      '&:hover': {
                        bgcolor: isSelected
                          ? theme.palette.primary.dark
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.06)',
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '2px',
                      },
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button
              fullWidth
              variant="contained"
              onClick={goForward}
              aria-label="Find restaurants"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: 16,
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              Find my perfect meal
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={goForward}
              aria-label="Skip dietary preferences and find restaurants"
              sx={{
                mt: 1,
                py: 1,
                borderRadius: '14px',
                fontWeight: 500,
                fontSize: 14,
                textTransform: 'none',
                color: theme.palette.text.secondary,
              }}
            >
              Skip
            </Button>
          </>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, mb: 0.5, fontSize: 26 }}
            >
              {discoverMutation.isPending ? 'Finding your perfect spot...' : 'Your top picks'}
            </Typography>
            {!discoverMutation.isPending && (
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 3,
                  fontSize: 15,
                }}
              >
                Curated just for you
              </Typography>
            )}

            {discoverMutation.isPending && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2,
                  minHeight: 300,
                }}
              >
                <CircularProgress
                  size={48}
                  thickness={3}
                  sx={{
                    color: theme.palette.primary.main,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Analyzing your preferences...
                </Typography>
              </Box>
            )}

            {discoverMutation.isError && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2,
                  minHeight: 300,
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  Something went wrong. Please try again.
                </Typography>
                <Button
                  variant="contained"
                  onClick={goBack}
                  sx={{
                    borderRadius: '14px',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Go back
                </Button>
              </Box>
            )}

            {discoverMutation.isSuccess && results.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2,
                  minHeight: 300,
                }}
              >
                <Typography sx={{ fontSize: 48 }}>
                  {'\uD83E\uDD14'}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  No matches found for your criteria. Try adjusting your filters.
                </Typography>
                <Button
                  variant="contained"
                  onClick={goBack}
                  sx={{
                    borderRadius: '14px',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Try again
                </Button>
              </Box>
            )}

            {discoverMutation.isSuccess && results.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {results.map((result, idx) => (
                  <DiscoverResultCard key={result.venue.id} result={result} index={idx} />
                ))}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setCurrentStep('occasion');
                    setDirection('backward');
                    setSelectedOccasion(null);
                    setSelectedDistance(null);
                    setSelectedDietary([]);
                    setResults([]);
                  }}
                  aria-label="Start over with new preferences"
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: '14px',
                    fontWeight: 600,
                    fontSize: 15,
                    textTransform: 'none',
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                >
                  Start over
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Progress dots */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 10,
        }}
        role="progressbar"
        aria-valuenow={currentStepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}
      >
        {STEP_ORDER.map((step, idx) => (
          <Box
            key={step}
            sx={{
              width: idx === currentStepIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: idx <= currentStepIndex
                ? theme.palette.primary.main
                : theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
