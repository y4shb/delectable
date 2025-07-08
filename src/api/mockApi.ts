// Mock API stubs for frontend development
import { User, Review, Playlist, Venue } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Tare Ebimami',
  avatarUrl: '/images/avatar1.jpg',
  followers: 1376,
  following: 86,
  level: 6,
  bio: 'Food. All of it.'
};

export const mockReviews: Review[] = [
  {
    id: 'r1',
    userId: '1',
    venueId: 'v1',
    rating: 9.8,
    text: 'Hayato is a must-try for kaiseki lovers.',
    photos: ['/images/food2.jpg'],
    createdAt: '2025-07-08T15:00:00Z',
  },
  // ...more
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'p1',
    userId: '1',
    title: 'Best LA Eats',
    description: 'My favorites in LA',
    items: [
      { id: 'pi1', venueId: 'v1', caption: 'Amazing sushi', photoUrl: '/images/food1.jpg', dateAdded: '2025-07-01' },
      { id: 'pi2', venueId: 'v2', caption: 'Incredible pasta', photoUrl: '/images/food2.jpg', dateAdded: '2025-07-02' },
    ],
    createdAt: '2025-07-01T12:00:00Z',
  },
];

export const mockVenues: Venue[] = [
  { id: 'v1', name: 'Hayato', location: 'Los Angeles, CA', cuisine: 'Japanese', rating: 9.8, photoUrl: '/images/food1.jpg', tags: ['kaiseki'] },
  { id: 'v2', name: 'Mother Wolf', location: 'Los Angeles, CA', cuisine: 'Italian', rating: 9.2, photoUrl: '/images/food2.jpg', tags: ['pasta'] },
];
