import { Box } from '@mui/material';
import { ReactNode } from 'react';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';

interface AppShellProps {
  children: ReactNode;
}

import React, { useRef, useState, useEffect } from 'react';

export default function AppShell({ children }: AppShellProps) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header visible={headerVisible} />
      <Box sx={{ flex: 1, width: '100%', maxWidth: 600, mx: 'auto', px: 2, py: 1, pt: '72px' }}>{children}</Box>
      <BottomTabBar />
    </Box>
  );
}
