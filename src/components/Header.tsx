import { AppBar, Box, Toolbar, Typography, IconButton, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useContext } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import { useRouter } from 'next/router';

import React from 'react';

interface HeaderProps {
  visible?: boolean;
}

export default function Header({ visible = true }: HeaderProps) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const router = useRouter();

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        zIndex: 1200,
        backdropFilter: 'blur(12px)',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(18, 18, 18, 0.75)'
          : 'rgba(255, 255, 255, 0.75)',
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
        transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
        transform: visible ? 'translateY(0)' : 'translateY(-110%)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 0, minHeight: 64 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: 1,
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            pl: 2.5
          }}>
          Delectable
        </Typography>
        <Box>
          <IconButton onClick={colorMode.toggleColorMode} color="inherit" aria-label="toggle theme">
            {theme.palette.mode === 'dark' ? <WbSunnyIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton color="inherit" onClick={() => router.push('/profile')} aria-label="profile">
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
