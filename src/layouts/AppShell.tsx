import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { Box, Fab } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';

const FAB_SEEN_KEY = 'delectable_fab_seen';

const pulseKeyframes = `
@keyframes fabPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
`;

interface AppShellProps {
  children: ReactNode;
  /** Hide the bottom tab bar (used for onboarding, quick review) */
  hideTabBar?: boolean;
}

export default function AppShell({ children, hideTabBar = false }: AppShellProps) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [shouldPulse, setShouldPulse] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY < 32) {
            setHeaderVisible(true);
          } else if (currentScrollY > lastScrollY.current) {
            setHeaderVisible(false); // scroll down
          } else {
            setHeaderVisible(true); // scroll up
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(FAB_SEEN_KEY);
      if (!seen) {
        setShouldPulse(true);
        localStorage.setItem(FAB_SEEN_KEY, 'true');
      }
    }
  }, []);

  const handleFabClick = () => {
    navigator.vibrate?.(10);
    router.push('/review/quick');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <style>{pulseKeyframes}</style>
      <Header visible={headerVisible} />
      <Box sx={{ flex: 1, width: '100%', maxWidth: 600, mx: 'auto', px: 2, py: 1, pt: '72px' }}>{children}</Box>
      {!hideTabBar && (
        <Fab
          aria-label="Quick review"
          onClick={handleFabClick}
          sx={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: headerVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)',
            opacity: headerVisible ? 1 : 0,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F24D4F 0%, #FF6B6B 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            animation: shouldPulse ? 'fabPulse 1s ease-in-out 3' : 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #F24D4F 0%, #FF6B6B 100%)',
            },
          }}
        >
          <CameraAlt sx={{ color: '#FFFFFF' }} />
        </Fab>
      )}
      {!hideTabBar && <BottomTabBar />}
    </Box>
  );
}
