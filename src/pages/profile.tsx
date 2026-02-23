import AppShell from '../layouts/AppShell';
import { Box, Typography, Avatar, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import ReviewCard from '../components/ReviewCard';
import { mockUser } from '../api/mockApi';

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mb: 1 }} src={mockUser.avatarUrl} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>{mockUser.name}</Typography>
          <Box
            sx={{
              backgroundColor: '#FFD36E',
              color: '#181818',
              fontWeight: 700,
              fontSize: 12,
              borderRadius: '12px',
              px: '8px',
              py: '2px',
              lineHeight: 1.4,
            }}
          >
            Lvl {mockUser.level}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {mockUser.followers.toLocaleString()} followers · {mockUser.following} following
        </Typography>
        <Typography variant="body1" color="text.secondary">{mockUser.bio}</Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Reviews" />
            <Tab label="Playlists" />
            <Tab label="Map" />
          </Tabs>
        </Box>
      </Box>
      <Box>
        {/* Example review card for profile */}
        <ReviewCard
          venue="Hibacci"
          location="New Delhi"
          dish="Omakase"
          tags={['Sushi', 'Japanese']}
          user={{ name: mockUser.name, avatarUrl: mockUser.avatarUrl, level: mockUser.level }}
          rating={9.8}
          text={'Hibacci is a must-try for sushi lovers.'}
          photoUrl={'/images/food2.jpg'}
          date={'2h ago'}
          likeCount={23}
          commentCount={8}
        />
      </Box>
    </AppShell>
  );
}
