import AppShell from '../layouts/AppShell';
import { Typography, Box } from '@mui/material';
import ReviewCard from '../components/ReviewCard';

const sampleReviews = [
  {
    user: { name: 'Tare Ebimami', avatarUrl: '/images/avatar1.jpg' },
    rating: 9.8,
    text: 'Hayato is a must-try for kaiseki lovers.',
    photoUrl: '/images/food2.jpg',
    date: '2h ago',
    caption: 'Unreal omakase',
    commentCount: 8,
  },
  {
    user: { name: 'Joci Stone', avatarUrl: '/images/avatar2.jpg' },
    rating: 9.4,
    text: 'Rigatoni at Ysabel is next-level. Perfect for date night.',
    photoUrl: '/images/food3.jpg',
    date: '5h ago',
    caption: 'Date night pasta',
    commentCount: 12,
  },
  {
    user: { name: 'Austin Coven', avatarUrl: '/images/avatar3.jpg' },
    rating: 8.7,
    text: 'Mother Wolf’s pizza is the best in LA. Don’t miss the cocktails.',
    photoUrl: '/images/food4.jpg',
    date: '1d ago',
    caption: 'Best pizza in LA',
    commentCount: 17,
  },
  {
    user: { name: 'Siri Kanter', avatarUrl: '/images/avatar4.jpg' },
    rating: 9.3,
    text: 'Rossoblu’s vibes and pasta are perfect for a group dinner.',
    photoUrl: '/images/food5.jpg',
    date: '3d ago',
    caption: 'Group dinner winner',
    commentCount: 5,
  },
];

export default function FeedPage() {
  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Feed
      </Typography>
      <Box
        sx={{
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
          pr: 1,
          scrollBehavior: 'smooth',
        }}
      >
        {sampleReviews.map((review, i) => (
          <ReviewCard key={i} {...review} />
        ))}
      </Box>
    </AppShell>
  );
}
