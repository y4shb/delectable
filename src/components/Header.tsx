import { AppBar, Box, Toolbar, Typography, IconButton, InputBase, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import React, { useContext, useState, useRef, useEffect } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import { useRouter } from 'next/router';

interface HeaderProps {
  visible?: boolean;
}

export default function Header({ visible = true }: HeaderProps) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      handleSearchClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const isDark = theme.palette.mode === 'dark';

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
        backdropFilter: 'blur(2px)',
        backgroundColor: isDark
          ? 'rgba(18, 18, 18, 0)'
          : 'rgba(255, 255, 255, 0)',
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
        transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
        transform: visible ? 'translateY(0)' : 'translateY(-110%)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', px: 0, minHeight: 64, position: 'relative' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: 1,
            fontFamily: '"Classy Pen", Helvetica, sans-serif',
            textAlign: 'center',
            position: 'absolute',
            left: 0,
            right: 0,
            margin: '0 auto',
            pointerEvents: 'none',
            fontSize: '38px',
            opacity: searchOpen ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}>
          de.
        </Typography>

        {searchOpen && (
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(12px)',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
              border: isDark
                ? '1px solid rgba(255,255,255,0.2)'
                : '1px solid rgba(0,0,0,0.1)',
              borderRadius: '24px',
              px: 2,
              py: 0.5,
              animation: 'searchSlideIn 0.3s ease forwards',
              '@keyframes searchSlideIn': {
                from: {
                  width: '40px',
                  opacity: 0,
                },
                to: {
                  width: '100%',
                  opacity: 1,
                },
              },
              transition: 'width 0.3s ease, opacity 0.3s ease',
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search venues, dishes..."
              sx={{
                flex: 1,
                color: 'text.primary',
                fontSize: '1rem',
                '& .MuiInputBase-input': {
                  padding: '8px 0',
                },
              }}
              inputProps={{
                'aria-label': 'Search input',
              }}
            />
            <IconButton
              onClick={handleSearchClose}
              size="small"
              color="inherit"
              aria-label="Close search"
              data-testid="search-close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box sx={{
          position: 'absolute',
          right: 8,
          top: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          opacity: searchOpen ? 0 : 1,
          pointerEvents: searchOpen ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}>
          <IconButton
            id="search-button"
            onClick={handleSearchOpen}
            color="inherit"
            aria-label="Search"
            data-testid="search-button"
          >
            <SearchIcon />
          </IconButton>
          <IconButton
            id="theme-toggle-button"
            onClick={colorMode.toggleColorMode}
            color="inherit"
            aria-label="Toggle theme"
            data-testid="theme-toggle"
          >
            {isDark ? <WbSunnyIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton
            id="profile-button"
            color="inherit"
            onClick={() => router.push('/profile')}
            aria-label="View profile"
            data-testid="profile-button"
          >
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
