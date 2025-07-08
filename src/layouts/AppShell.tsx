import { Box } from '@mui/material';
import { ReactNode } from 'react';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />
      <Box sx={{ flex: 1, width: '100%', maxWidth: 600, mx: 'auto', px: 2, py: 1 }}>{children}</Box>
      <BottomTabBar />
    </Box>
  );
}
