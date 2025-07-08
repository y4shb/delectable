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
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, borderRadius: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
          router.push(tabConfig[newValue].route);
        }}
        sx={{ maxWidth: 600, mx: 'auto' }}
      >
        {tabConfig.map(tab => (
          <BottomNavigationAction key={tab.label} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
