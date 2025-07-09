import AppShell from '../layouts/AppShell';
import { Box, Typography, Avatar, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import ReviewCard from '../components/ReviewCard';

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mb: 1 }} src="/images/avatar1.jpg" />
        <Typography variant="h6" fontWeight={700}>Yash Bhardwaj</Typography>
        <Typography variant="body2" color="text.secondary">1,376 followers · 86 following</Typography>
        <Typography variant="body" color="text.secondary">I do be eating</Typography>  
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
          user={{ name: 'Yash Bhardwaj', avatarUrl: '/images/avatar1.jpg', level: 9 }}
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
