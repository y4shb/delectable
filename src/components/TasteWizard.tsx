import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Slider,
  useTheme,
  Fade,
  Snackbar,
  Alert,
} from '@mui/material';
import { updateTasteProfile } from '../api/api';
import type { TasteProfile } from '../types';

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

interface TasteWizardProps {
  onComplete: () => void;
}

export default function TasteWizard({ onComplete }: TasteWizardProps) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [pricePreference, setPricePreference] = useState(2);
  const [spiceTolerance, setSpiceTolerance] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

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

  const handleFinish = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const profile: Partial<TasteProfile> = {
        preferredCuisines: selectedCuisines,
        dietaryRestrictions: selectedDietary,
        pricePreference,
        spiceTolerance,
        completedWizard: true,
      };
      await updateTasteProfile(profile);
      onComplete();
    } catch {
      // Show error but still allow user to continue
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const priceLabels: Record<number, string> = {
    1: '$',
    2: '$$',
    3: '$$$',
    4: '$$$$',
  };

  const spiceLabels: Record<number, string> = {
    1: 'Mild',
    2: 'Medium',
    3: 'Spicy',
    4: 'Very Spicy',
    5: 'Fire',
  };

  return (
    <Box
      sx={{
        maxWidth: 420,
        mx: 'auto',
        px: 2,
        py: 4,
      }}
    >
      {/* Header */}
      <Typography
        variant="h5"
        sx={{
          fontFamily: '"Classy Pen", Helvetica, sans-serif',
          color: theme.palette.primary.main,
          fontSize: 28,
          mb: 0.5,
          textAlign: 'center',
        }}
      >
        Tell us your taste
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 14, mb: 3, textAlign: 'center' }}
      >
        Help us personalize your feed
      </Typography>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
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
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>
              What cuisines do you love?
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
              Select 3-8 favorites
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {CUISINES.map(({ label, emoji }) => {
                const selected = selectedCuisines.includes(label);
                return (
                  <Chip
                    key={label}
                    label={`${emoji} ${label}`}
                    onClick={() => toggleCuisine(label)}
                    sx={{
                      fontWeight: 600,
                      fontSize: 14,
                      py: 2.5,
                      px: 0.5,
                      borderRadius: '20px',
                      bgcolor: selected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      color: selected ? '#fff' : theme.palette.text.primary,
                      border: selected
                        ? 'none'
                        : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
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
                mt: 3,
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
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>
              Any dietary preferences?
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
              Select all that apply (optional)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DIETARY.map((diet) => {
                const selected = selectedDietary.includes(diet);
                return (
                  <Chip
                    key={diet}
                    label={diet}
                    onClick={() => toggleDietary(diet)}
                    sx={{
                      fontWeight: 600,
                      fontSize: 14,
                      py: 2.5,
                      px: 0.5,
                      borderRadius: '20px',
                      bgcolor: selected
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      color: selected ? '#fff' : theme.palette.text.primary,
                      border: selected
                        ? 'none'
                        : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
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
            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
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

      {/* Step 3: Price & Spice */}
      {step === 2 && (
        <Fade in>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>
              Almost done!
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1 }}>
                Price range preference
              </Typography>
              <Slider
                value={pricePreference}
                onChange={(_, v) => setPricePreference(v as number)}
                min={1}
                max={4}
                step={1}
                marks={[1, 2, 3, 4].map((v) => ({
                  value: v,
                  label: priceLabels[v],
                }))}
                sx={{ mx: 1 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1 }}>
                Spice tolerance
              </Typography>
              <Slider
                value={spiceTolerance}
                onChange={(_, v) => setSpiceTolerance(v as number)}
                min={1}
                max={5}
                step={1}
                marks={[1, 2, 3, 4, 5].map((v) => ({
                  value: v,
                  label: spiceLabels[v],
                }))}
                sx={{ mx: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
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
                {saving ? 'Saving...' : 'Get Started'}
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Skip button */}
      <Button
        onClick={onComplete}
        sx={{
          mt: 2,
          mx: 'auto',
          display: 'block',
          color: 'text.secondary',
          textTransform: 'none',
          fontSize: 14,
        }}
      >
        Skip for now
      </Button>

      {/* Error snackbar */}
      <Snackbar
        open={saveError}
        autoHideDuration={6000}
        onClose={() => setSaveError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSaveError(false)}
          severity="warning"
          sx={{ width: '100%' }}
        >
          Couldn&apos;t save preferences. You can update them later in settings.
        </Alert>
      </Snackbar>
    </Box>
  );
}
