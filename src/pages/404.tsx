import { Box, Typography, Button, useTheme } from '@mui/material';
import Link from 'next/link';

export default function Custom404() {
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
            mb: 2,
          }}
        >
          de.
        </Typography>

        {/* 404 heading */}
        <Typography
          sx={{
            fontSize: 72,
            fontWeight: 700,
            color: theme.palette.primary.main,
            lineHeight: 1,
            mb: 1,
          }}
        >
          404
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 4,
          }}
        >
          This page doesn&apos;t exist
        </Typography>

        {/* Go Home button */}
        <Link href="/" passHref legacyBehavior>
          <Button
            component="a"
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              borderRadius: '48px',
              py: 1.5,
              px: 4,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#d93e40',
              },
            }}
          >
            Go Home
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
