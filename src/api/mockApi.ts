// Mock API stubs for frontend development
import { User, Review, Playlist, Venue } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Yash Bhardwaj',
  avatarUrl: '/images/avatar1.jpg',
  followers: 465,
  following: 92,
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
  // ...more
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'p1',
    userId: '1',
    title: 'Best Coffee shops',
    description: 'My favorites in Delhi',
    items: [
      { id: 'pi1', venueId: 'v1', caption: 'Dope Coffee', photoUrl: '/images/food1.jpg', dateAdded: '2025-07-01' },
      { id: 'pi2', venueId: 'v2', caption: 'Incredible pasta', photoUrl: '/images/food2.jpg', dateAdded: '2025-07-02' },
    ],
    createdAt: '2025-07-01T12:00:00Z',
  },
];

export const mockVenues: Venue[] = [
  { id: 'v1', name: 'Hibacci', location: 'New Delhi', cuisine: 'Japanese', rating: 9.8, photoUrl: '/images/food1.jpg', tags: ['sushi'] },
  { id: 'v2', name: 'Pizzeria', location: 'New Delhi', cuisine: 'Italian', rating: 9.2, photoUrl: '/images/food2.jpg', tags: ['pasta', 'pizza'] },
];
