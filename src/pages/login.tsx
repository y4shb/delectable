import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/feed');
  }, [isAuthenticated, router]);

  // Show nothing while restoring session
  if (isLoading || isAuthenticated) {
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
      // Check for redirect param
      const redirect = router.query.redirect as string;
      const isRelative = redirect && redirect.startsWith('/') && !redirect.startsWith('//');
      router.push(isRelative ? redirect : '/feed');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(email, name, password, passwordConfirm);
      // Redirect new users to onboarding
      router.push('/onboarding');
    } catch {
      setError('Registration failed. Email may already be in use.');
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

        {/* Name field (sign up only) */}
        {isSignUp && (
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
            disabled={submitting}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              },
            }}
          />
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
            if (e.key === 'Enter' && !isSignUp) handleSignIn();
          }}
          sx={{
            mb: isSignUp ? 2 : 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            },
          }}
        />

        {/* Confirm password (sign up only) */}
        {isSignUp && (
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            fullWidth
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            aria-label="Confirm password"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSignUp();
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              },
            }}
          />
        )}

        {/* Sign In / Sign Up button */}
        <Button
          variant="contained"
          fullWidth
          disableElevation
          onClick={isSignUp ? handleSignUp : handleSignIn}
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
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : isSignUp ? (
            'Create Account'
          ) : (
            'Sign In'
          )}
        </Button>

        {/* Toggle between sign in and sign up */}
        <Button
          variant="text"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          sx={{
            mt: 2,
            color: theme.palette.primary.main,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
          }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Create Account'}
        </Button>
      </Box>
    </Box>
  );
}
