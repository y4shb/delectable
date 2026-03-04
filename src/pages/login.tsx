import { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Show nothing while restoring session
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.replace('/feed');
    return null;
  }

  const handleSignIn = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/feed');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand logo */}
        <Typography
          sx={{
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            fontSize: 56,
            fontWeight: 700,
            color: theme.palette.primary.main,
            lineHeight: 1,
            mb: 0.5,
          }}
        >
          de.
        </Typography>

        {/* App name */}
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: 'Inter, Arial, sans-serif',
            color: theme.palette.text.secondary,
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          Delectable
        </Typography>

        {/* Tagline */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mb: 5,
          }}
        >
          Discover. Curate. Share.
        </Typography>

        {/* Error message */}
        {error && (
          <Typography
            sx={{
              color: theme.palette.error.main,
              fontSize: 14,
              mb: 2,
              textAlign: 'center',
            }}
          >
            {error}
          </Typography>
        )}

        {/* Email field */}
        <TextField
          label="Email"
          variant="outlined"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          disabled={submitting}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            },
          }}
        />

        {/* Password field */}
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSignIn();
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            },
          }}
        />

        {/* Sign In button */}
        <Button
          variant="contained"
          fullWidth
          disableElevation
          onClick={handleSignIn}
          disabled={submitting}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            borderRadius: '48px',
            fontWeight: 700,
            fontSize: '1rem',
            py: 1.5,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        {/* Create Account link */}
        <Button
          variant="text"
          disabled
          sx={{
            mt: 2,
            color: theme.palette.primary.main,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
            '&.Mui-disabled': {
              color: theme.palette.text.secondary,
            },
          }}
        >
          Create Account (Coming Soon)
        </Button>
      </Box>
    </Box>
  );
}
