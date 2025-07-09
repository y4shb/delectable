import AppShell from '../layouts/AppShell';
import { Typography, Box } from '@mui/material';
import ReviewCard from '../components/ReviewCard';

const sampleReviews = [
  {
    venue: 'SavorWorks',
    location: 'New Delhi',
    dish: 'Stuffed Chicken',
    tags: ['Coffee', 'Experimental', 'Solo-date'],
    user: { name: 'Yash Bhardwaj', avatarUrl: '/images/avatar1.jpg', level: 6 },
    rating: 9.4,
    text: 'SavorWorks has my heart.',
    photoUrl: '/images/food3.jpg',
    date: '2h ago',
    likeCount: 24,
    commentCount: 8,
  },
  {
    venue: 'Big Chill',
    location: 'GK-2',
    dish: '',
    tags: ['American', 'Burgers', 'Diner'],
    user: { name: 'Jake Gylenhall', avatarUrl: '/images/avatar2.jpg', level: 17 },
    rating: 9.2,
    text: 'The baked Pizza-rolls are out of this world.',
    photoUrl: '/images/food5.jpg',
    date: '4h ago',
    likeCount: 17,
    commentCount: 3,
  },
  {
    venue: 'Paul',
    location: 'European · Saket',
    dish: 'Penne Arabiata',
    tags: ['Desserts', 'Pasta'],
    user: { name: 'Mad Max', avatarUrl: '/images/avatar3.jpg', level: 17 },
    rating: 9.8,
    text: 'Paul’s pasta is the best in Delhi. Don’t miss the tiramisu!',
    photoUrl: '/images/food4.jpg',
    date: '1d ago',
    likeCount: 31,
    commentCount: 10,
  },
  {
    venue: 'Rossoblu',
    location: 'Italian · DTLA',
    dish: 'Tagliatelle',
    tags: ['Group Dinner'],
    user: { name: 'Jason Derulo', avatarUrl: '/images/avatar4.jpg', level: 15 },
    rating: 9.3,
    text: 'Rossoblu’s vibes and pasta are perfect for a group dinner.',
    photoUrl: '/images/food2.jpg',
    date: '3d ago',
    likeCount: 12,
    commentCount: 5,
  },
];

export default function FeedPage() {
  return (
    <AppShell>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'none' }}>
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
