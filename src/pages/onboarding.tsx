import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Slider,
  Avatar,
  CircularProgress,
  useTheme,
  Fade,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppShell from '../layouts/AppShell';
import { useAuth } from '../context/AuthContext';
import {
  updateTasteProfile,
  fetchSuggestedUsers,
  followUser,
} from '../api/api';
import type { TasteProfile, User } from '../types';

const CUISINES = [
  { label: 'Italian', emoji: '\uD83C\uDDEE\uD83C\uDDF9' },
  { label: 'Japanese', emoji: '\uD83C\uDDEF\uD83C\uDDF5' },
  { label: 'Indian', emoji: '\uD83C\uDDEE\uD83C\uDDF3' },
  { label: 'Mexican', emoji: '\uD83C\uDDF2\uD83C\uDDFD' },
  { label: 'Chinese', emoji: '\uD83C\uDDE8\uD83C\uDDF3' },
  { label: 'Thai', emoji: '\uD83C\uDDF9\uD83C\uDDED' },
  { label: 'Korean', emoji: '\uD83C\uDDF0\uD83C\uDDF7' },
  { label: 'American', emoji: '\uD83C\uDDFA\uD83C\uDDF8' },
  { label: 'French', emoji: '\uD83C\uDDEB\uD83C\uDDF7' },
  { label: 'Mediterranean', emoji: '\uD83E\uDED2' },
  { label: 'Vietnamese', emoji: '\uD83C\uDDFB\uD83C\uDDF3' },
  { label: 'Middle Eastern', emoji: '\uD83E\uDDC6' },
];

const DIETARY = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
  'Nut-Free',
  'Pescatarian',
];

export default function OnboardingPage() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Fetch suggested users for step 3
  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: fetchSuggestedUsers,
    enabled: step === 2 && isAuthenticated,
  });

  const followMutation = useMutation({
    mutationFn: followUser,
    onSuccess: (_, userId) => {
      setFollowedUsers((prev) => new Set(prev).add(userId));
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  if (authLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : prev.length < 8
          ? [...prev, cuisine]
          : prev,
    );
  };

  const toggleDietary = (diet: string) => {
    setSelectedDietary((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet],
    );
  };

  const handleFollowUser = (userId: string) => {
    if (!followedUsers.has(userId)) {
      followMutation.mutate(userId);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const profile: Partial<TasteProfile> = {
        preferredCuisines: selectedCuisines,
        dietaryRestrictions: selectedDietary,
        completedWizard: true,
      };
      await updateTasteProfile(profile);
    } catch {
      // Continue even if save fails
    }
    setSaving(false);
    router.push('/feed');
  };

  const handleSkip = () => {
    router.push('/feed');
  };

  return (
    <AppShell hideTabBar>
      <Box
        sx={{
          maxWidth: 420,
          mx: 'auto',
          px: 2,
          py: 4,
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            color: theme.palette.primary.main,
            fontSize: 32,
            mb: 0.5,
            textAlign: 'center',
          }}
        >
          Welcome to de.
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14, mb: 4, textAlign: 'center' }}
        >
          Let&apos;s personalize your experience
        </Typography>

        {/* Progress dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor:
                  i === step
                    ? theme.palette.primary.main
                    : i < step
                      ? theme.palette.primary.light
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Step 1: Cuisines */}
        {step === 0 && (
          <Fade in>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 20, mb: 0.5 }}>
                What cuisines do you love?
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Select 3-8 favorites
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {CUISINES.map(({ label, emoji }) => {
                  const selected = selectedCuisines.includes(label);
                  return (
                    <Chip
                      key={label}
                      label={`${emoji} ${label}`}
                      onClick={() => toggleCuisine(label)}
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        py: 2.5,
                        px: 1,
                        borderRadius: '24px',
                        bgcolor: selected
                          ? theme.palette.primary.main
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        color: selected ? '#fff' : theme.palette.text.primary,
                        border: selected
                          ? 'none'
                          : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: selected
                            ? theme.palette.primary.dark
                            : theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.08)',
                        },
                      }}
                    />
                  );
                })}
              </Box>
              <Button
                fullWidth
                variant="contained"
                disabled={selectedCuisines.length < 3}
                onClick={() => setStep(1)}
                sx={{
                  mt: 4,
                  py: 1.5,
                  borderRadius: '48px',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 16,
                }}
              >
                Continue
              </Button>
            </Box>
          </Fade>
        )}

        {/* Step 2: Dietary */}
        {step === 1 && (
          <Fade in>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 20, mb: 0.5 }}>
                Any dietary preferences?
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Select all that apply (optional)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {DIETARY.map((diet) => {
                  const selected = selectedDietary.includes(diet);
                  return (
                    <Chip
                      key={diet}
                      label={diet}
                      onClick={() => toggleDietary(diet)}
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        py: 2.5,
                        px: 1,
                        borderRadius: '24px',
                        bgcolor: selected
                          ? theme.palette.primary.main
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        color: selected ? '#fff' : theme.palette.text.primary,
                        border: selected
                          ? 'none'
                          : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: selected
                            ? theme.palette.primary.dark
                            : theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.08)',
                        },
                      }}
                    />
                  );
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setStep(0)}
                  sx={{
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
                  fullWidth
                  variant="contained"
                  onClick={() => setStep(2)}
                  sx={{
                    py: 1.5,
                    borderRadius: '48px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 16,
                  }}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 3: Follow Tastemakers */}
        {step === 2 && (
          <Fade in>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 20, mb: 0.5 }}>
                Follow some tastemakers
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
                Get great recommendations in your feed
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(suggestedUsers ?? []).slice(0, 5).map((user: User) => {
                  const isFollowed = followedUsers.has(user.id);
                  return (
                    <Box
                      key={user.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: '16px',
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <Avatar
                        src={user.avatarUrl}
                        sx={{ width: 48, height: 48 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                          {user.name}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 13 }}
                        >
                          {user.bio?.slice(0, 50) || `${user.followersCount ?? 0} followers`}
                        </Typography>
                      </Box>
                      <Button
                        variant={isFollowed ? 'outlined' : 'contained'}
                        size="small"
                        onClick={() => handleFollowUser(user.id)}
                        disabled={isFollowed}
                        sx={{
                          borderRadius: '20px',
                          fontWeight: 600,
                          textTransform: 'none',
                          minWidth: 80,
                        }}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </Button>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setStep(1)}
                  sx={{
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
                  fullWidth
                  variant="contained"
                  disabled={saving}
                  onClick={handleFinish}
                  sx={{
                    py: 1.5,
                    borderRadius: '48px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 16,
                  }}
                >
                  {saving ? 'Finishing...' : 'Get Started'}
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Skip button */}
        <Button
          onClick={handleSkip}
          sx={{
            mt: 3,
            mx: 'auto',
            display: 'block',
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: 14,
          }}
        >
          Skip for now
        </Button>
      </Box>
    </AppShell>
  );
}
