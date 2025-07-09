import { AppBar, Box, Toolbar, Typography, IconButton, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useContext } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import { useRouter } from 'next/router';

export default function Header() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const router = useRouter();

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
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
