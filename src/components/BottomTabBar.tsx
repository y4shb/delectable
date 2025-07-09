import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const tabConfig = [
  { label: 'Feed', icon: <HomeIcon />, route: '/feed' },
  { label: 'Map', icon: <MapIcon />, route: '/map' },
  { label: 'Add', icon: <AddCircleIcon />, route: '/playlist/new' },
  { label: 'Alerts', icon: <NotificationsIcon />, route: '/notifications' },
  { label: 'Profile', icon: <PersonIcon />, route: '/profile' },
];

export default function BottomTabBar() {
  const router = useRouter();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const idx = tabConfig.findIndex(tab => router.pathname.startsWith(tab.route.replace('/new', '')));
    setValue(idx === -1 ? 0 : idx);
  }, [router.pathname]);

  return (
    <Paper
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 20,
        borderRadius: 6,
        boxShadow: '0 6px 24px 0 rgba(0,0,0,0.13)',
        px: 2.9,
        py: 0.02, // 20% shorter
        maxWidth: 275, // 35% shorter than 340px
        width: '90%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(1px)',
        backgroundColor: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(18, 18, 18, 0.75)'
          : 'rgba(255, 255, 255, 0.75)',
        backgroundClip: 'padding-box',
      }}
      elevation={5}
    >
      <BottomNavigation
        showLabels={false}
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
          router.push(tabConfig[newValue].route);
        }}
        sx={{
          width: '100%',
          background: 'transparent',
        }}
      >
        {tabConfig.map(tab => (
          <BottomNavigationAction
            key={tab.label}
            icon={React.cloneElement(tab.icon, { sx: { fontSize: 26 } })}
            sx={{ minWidth: 0, px: 1.2, py: 0.3, color: 'inherit' }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
