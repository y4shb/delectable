// Mock API stubs for frontend development
import { User, Review, Playlist, Venue } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Yash Bhardwaj',
  avatarUrl: '/images/avatar1.jpg',
  followers: 1376,
  following: 86,
  level: 9,
  bio: 'I do be eating'
};

export const mockReviews: Review[] = [
  {
    id: 'r1',
    userId: '1',
    venueId: 'v1',
    rating: 9.8,
    text: 'Hibacci is a must-try for sushi lovers.',
    photos: ['/images/food2.jpg'],
    createdAt: '2025-07-08T15:00:00Z',
  },
  {
    id: 'r2',
    userId: '2',
    venueId: 'v3',
    rating: 9.4,
    text: 'SavorWorks has my heart.',
    photos: ['/images/food3.jpg'],
    createdAt: '2025-07-10T12:00:00Z',
  },
  {
    id: 'r3',
    userId: '3',
    venueId: 'v4',
    rating: 9.2,
    text: 'The baked Pizza-rolls are out of this world.',
    photos: ['/images/food5.jpg'],
    createdAt: '2025-07-09T10:00:00Z',
  },
  {
    id: 'r4',
    userId: '4',
    venueId: 'v5',
    rating: 9.8,
    text: "Paul\u2019s pasta is the best in Delhi. Don\u2019t miss the tiramisu!",
    photos: ['/images/food4.jpg'],
    createdAt: '2025-07-07T18:00:00Z',
  },
  {
    id: 'r5',
    userId: '5',
    venueId: 'v6',
    rating: 9.3,
    text: "Rossoblu\u2019s vibes and pasta are perfect for a group dinner.",
    photos: ['/images/food2.jpg'],
    createdAt: '2025-07-05T20:00:00Z',
  },
];

// Feed card data (used by feed.tsx) — richer than the Review type for UI display
export interface FeedReview {
  venue: string;
  location: string;
  dish?: string;
  tags: string[];
  user: { name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  date: string;
  likeCount: number;
  commentCount: number;
}

export const mockFeedReviews: FeedReview[] = [
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
    user: { name: 'Jake Gylenhall', avatarUrl: '/images/avatar1.jpg', level: 17 },
    rating: 9.2,
    text: 'The baked Pizza-rolls are out of this world.',
    photoUrl: '/images/food5.jpg',
    date: '4h ago',
    likeCount: 17,
    commentCount: 3,
  },
  {
    venue: 'Paul',
    location: 'European \u00b7 Saket',
    dish: 'Penne Arabiata',
    tags: ['Desserts', 'Pasta'],
    user: { name: 'Mad Max', avatarUrl: '/images/avatar1.jpg', level: 17 },
    rating: 9.8,
    text: "Paul\u2019s pasta is the best in Delhi. Don\u2019t miss the tiramisu!",
    photoUrl: '/images/food4.jpg',
    date: '1d ago',
    likeCount: 31,
    commentCount: 10,
  },
  {
    venue: 'Rossoblu',
    location: 'Italian \u00b7 DTLA',
    dish: 'Tagliatelle',
    tags: ['Group Dinner'],
    user: { name: 'Jason Derulo', avatarUrl: '/images/avatar1.jpg', level: 15 },
    rating: 9.3,
    text: "Rossoblu\u2019s vibes and pasta are perfect for a group dinner.",
    photoUrl: '/images/food2.jpg',
    date: '3d ago',
    likeCount: 12,
    commentCount: 5,
  },
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'p1',
    userId: '1',
    title: 'Best Coffee Shops',
    description: 'My favorites in Delhi',
    items: [
      { id: 'pi1', venueId: 'v1', caption: 'Dope Coffee', photoUrl: '/images/food3.jpg', dateAdded: '2025-07-01' },
      { id: 'pi2', venueId: 'v2', caption: 'Incredible pasta', photoUrl: '/images/food2.jpg', dateAdded: '2025-07-02' },
      { id: 'pi3', venueId: 'v5', caption: 'Tiramisu heaven', photoUrl: '/images/food4.jpg', dateAdded: '2025-07-03' },
    ],
    createdAt: '2025-07-01T12:00:00Z',
  },
  {
    id: 'p2',
    userId: '1',
    title: 'Date Night Spots',
    description: 'Romantic dinners in the city',
    items: [
      { id: 'pi4', venueId: 'v6', caption: 'Perfect ambiance', photoUrl: '/images/food5.jpg', dateAdded: '2025-07-04' },
      { id: 'pi5', venueId: 'v3', caption: 'Cozy vibes', photoUrl: '/images/food3.jpg', dateAdded: '2025-07-05' },
    ],
    createdAt: '2025-07-02T12:00:00Z',
  },
];

export const mockVenues: Venue[] = [
  { id: 'v1', name: 'Hibacci', location: 'New Delhi', cuisine: 'Japanese', rating: 9.8, photoUrl: '/images/food2.jpg', tags: ['Sushi', 'Japanese'] },
  { id: 'v2', name: 'Pizzeria', location: 'New Delhi', cuisine: 'Italian', rating: 9.2, photoUrl: '/images/food5.jpg', tags: ['Pasta', 'Pizza'] },
  { id: 'v3', name: 'SavorWorks', location: 'New Delhi', cuisine: 'Experimental', rating: 9.4, photoUrl: '/images/food3.jpg', tags: ['Coffee', 'Experimental'] },
  { id: 'v4', name: 'Big Chill', location: 'GK-2', cuisine: 'American', rating: 9.2, photoUrl: '/images/food5.jpg', tags: ['American', 'Burgers'] },
  { id: 'v5', name: 'Paul', location: 'Saket', cuisine: 'European', rating: 9.8, photoUrl: '/images/food4.jpg', tags: ['Desserts', 'Pasta'] },
  { id: 'v6', name: 'Rossoblu', location: 'DTLA', cuisine: 'Italian', rating: 9.3, photoUrl: '/images/food2.jpg', tags: ['Group Dinner'] },
];
