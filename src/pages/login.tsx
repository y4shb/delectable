import { Box, Typography, TextField, Button, useTheme } from '@mui/material';

export default function LoginPage() {
  const theme = useTheme();

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

        {/* Email field */}
        <TextField
          label="Email"
          variant="outlined"
          type="email"
          fullWidth
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
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            borderRadius: '48px',
            fontWeight: 700,
            fontSize: '1rem',
            py: 1.5,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#d93e40',
            },
          }}
        >
          Sign In
        </Button>

        {/* Create Account link */}
        <Button
          variant="text"
          sx={{
            mt: 2,
            color: theme.palette.primary.main,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
          }}
        >
          Create Account
        </Button>
      </Box>
    </Box>
  );
}
